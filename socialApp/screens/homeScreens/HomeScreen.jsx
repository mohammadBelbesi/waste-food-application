import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, FlatList, ActivityIndicator, RefreshControl, View, Text } from 'react-native';
import { AuthContext } from '../../navigation/AuthProvider';
import { Container } from '../../styles/feedStyles';
import PostCard from '../../components/postCard/PostCard';
import AddPostCard from '../../components/addPost/AddPostCard';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { watchLocation } from '../../hooks/helpersMap/watchLocation';
import { getLocation } from '../../hooks/helpersMap/getLocation';
import { useDarkMode } from '../../styles/DarkModeContext';
import { getPostsWithFilters, getPostsFromFollowers } from '../../FirebaseFunctions/collections/post';
import { useRoute } from "@react-navigation/native";
import { Button } from 'react-native-elements';
import { set } from 'firebase/database';

const HomeScreen = () => {
    const route = useRoute();
    const { user, logout } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [firstFetchForYou, setFirstFetchForYou] = useState(true);
    const [firstFetchFollowing, setFirstFetchFollowing] = useState(true);
    const [lastVisible, setLastVisible] = useState(null);
    const [haveMorePosts, setHaveMorePosts] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [position, setPosition] = useState(null);
    const [radius, setRadius] = useState(10);
    const [selectedCategories, setSelectedCategories] = useState([]);
    // console.log("31 ----------",route.params?.feedChoice )
    const [feedChoice, setFeedChoice] = useState('For You');
    // // console.log("33 ----------",feedChoice )
    const { theme } = useDarkMode();
    const isFocused = useIsFocused();
    const navigation = useNavigation();

    const fetchData = async (loadMore = false) => {
        if (!position && feedChoice === 'For You') {
            console.info("No position found");
            return;
        }
        if (!loadMore && !lastVisible && (!firstFetchForYou || !firstFetchFollowing)) {
            console.log("No lastVisible found for initial load");
            return;
        }
        if (!haveMorePosts && loadMore) {
            console.log("No more posts to load");
            setLoadingMore(false);
            return;
        }
        console.log("FEED CHOICE", feedChoice);
        try {
            if (loadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
    
            let newPosts = [];
            let lastVisibleDoc = loadMore ? lastVisible : null;
            let isMore = false;
    
            if (feedChoice === 'For You') {
                const result = await getPostsWithFilters(
                    [position.latitude, position.longitude],
                    radius,
                    user.uid,
                    selectedCategories,
                    false,
                    lastVisibleDoc,
                    haveMorePosts
                );
                newPosts = result.posts;
                lastVisibleDoc = result.lastVisible;
                // isMore = result.isMore;
            } else {
                const result = await getPostsFromFollowers(user.uid, false, lastVisibleDoc);
                console.log("HOME SCREEN:posts from followers:", result.posts);
                newPosts = result.posts;
                lastVisibleDoc = result.lastVisible;
                // isMore = result.isMore;
                console.log("HOME SCREEN:posts from followers:", newPosts);
            }
    
            if (loadMore) {
                setPosts(prevPosts => {
                    const newUniquePosts = newPosts.filter(newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id));
                    return [...prevPosts, ...newUniquePosts];
                });
            } else {
                console.log("I am here")
                setPosts(newPosts);
                console.log("SET POSTS", posts)
            }
    
            if (feedChoice === 'For You' && firstFetchForYou) setFirstFetchForYou(false);
            if (feedChoice === 'Following' && firstFetchFollowing) setFirstFetchFollowing(false);
    
            setLastVisible(lastVisibleDoc);
            setHaveMorePosts(isMore);
            setLoading(false);
            setLoadingMore(false);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error.message);
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        const fetchLocationAndPosts = async () => {
            await getLocation(setPosition);
        };
        fetchLocationAndPosts();
     }, []);

    useEffect(() => {
        if (isFocused) {
            console.log("route.params.feedChoice", route.params?.feedChoice);
            setFeedChoice(route.params?.feedChoice || 'For You');
            setRadius(route.params?.radius || 10);
            setSelectedCategories(route.params?.selectedCategories || []);
            setLastVisible(null);
            setHaveMorePosts(true);
            setFirstFetchForYou(true);
            setFirstFetchFollowing(true);
            fetchData();
        }
    }, [isFocused, route.params]);

   useEffect(() => {
        if (position && feedChoice) {
            setLastVisible(null);
            setHaveMorePosts(true);
            fetchData();
        }
        if (position) {
            // setFeedChoice(route.params?.feedChoice || 'For You');
            // setRadius(route.params?.radius || 10);
            // setSelectedCategories(route.params?.selectedCategories || []);
            // setLastVisible(null);
            // setHaveMorePosts(true);
            // setFirstFetchForYou(true);
            // setFirstFetchFollowing(true);
            // fetchData();
        }
    }, [position, feedChoice, selectedCategories, radius]);

    const onRefresh = async () => {
        setRefreshing(true);
        setLastVisible(null);
        setHaveMorePosts(true);
        await fetchData();
        setRefreshing(false);
     };

    const loadMore = async () => {
     if (!loadingMore && lastVisible && !isLoadingMore && haveMorePosts) {
           setIsLoadingMore(true);
        //     // await fetchData(true);
          setIsLoadingMore(false);
     }
    };

    if (loading && !loadingMore && posts.length !== 0) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.appBackGroundColor }]}>
                <ActivityIndicator size="large" color={theme.primaryText} />
            </View>
        );
    }

    if (error) {
        return <Text style={{ color: theme.primaryText }}>Error: {error}</Text>;
    }

    return (
        <Container style={[styles.container, { backgroundColor: theme.appBackGroundColor }]}>
               <AddPostCard/>
                <FlatList
                data={posts}
                style={{ width: '100%' }}
                renderItem={({ item, index }) => {
                    if (item && item.id) {
                        return <PostCard key={item.id} item={item} navigation={navigation} postUserId={item.userId} isProfilePage={false} userLocation={position} />;
                    } else {
                        return null;
                    }
                }}
                keyExtractor={(item, index) => item.id ? item.id : index.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.flatListContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primaryText}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.1}
                ListFooterComponent={loadingMore && <ActivityIndicator size="large" color={theme.primaryText} />}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: theme.primaryText }}>No posts available. Pull down to refresh.</Text>
                    </View>
                )}
            /> 
            
        </Container>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default HomeScreen;