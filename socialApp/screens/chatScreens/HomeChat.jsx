import React, { useState, useEffect, useContext } from 'react';
import { View, FlatList, StyleSheet, TextInput } from 'react-native';
import { ListItem, Avatar } from 'react-native-elements';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { windowHeight, windowWidth } from '../../utils/Dimentions';
import { AuthContext } from '../../navigation/AuthProvider';
import { getListChats } from '../../FirebaseFunctions/collections/chat';
import { getDoc, doc } from 'firebase/firestore';
import { database } from '../../firebase';
import { useDarkMode } from '../../styles/DarkModeContext'; // Import the dark mode context

const HomeChat = ({ navigation }) => {
  const { user } = useContext(AuthContext);
  const { theme } = useDarkMode(); // Access the current theme
  const [listChats, setListChats] = useState([]);
  const [search, setSearch] = useState('');
  const [userConnected, setUserConnected] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user_data = await fetchUser(user.uid);
      user_data.id = user.uid;
      setUserConnected(user_data);
      getListChats(user.uid, setListChats);
    };

    fetchData();
  }, []);

  const renderItem = ({ item }) => (
    <ListItem
      bottomDivider
      containerStyle={{ ...styles.listItem, backgroundColor: theme.listItemBackground }}
      onPress={() => navigation.navigate('SingleChat', { receiverData: item, userConnected: userConnected })}
    >
      {item.image ? (
        <Avatar source={{ uri: item.image }} rounded title={item.receiver} size="medium" />
      ) : (
        <Avatar source={require('../../assets/Images/emptyProfieImage.png')} title={item.receiver} size="medium" rounded />
      )}

      <ListItem.Content>
        <ListItem.Title style={{ ...styles.listItemTitle, color: theme.primaryText }}>
          {item.receiver}
        </ListItem.Title>

        <ListItem.Subtitle numberOfLines={1} style={{ ...styles.listItemSubtitle, color: theme.secondaryText }}>
          {item.lastMsg}
        </ListItem.Subtitle>
      </ListItem.Content>
    </ListItem>
  );

  return (
    <View style={{ ...styles.container, backgroundColor: theme.appBackGroundColor }}>
      <View style={{ ...styles.searchContainer, backgroundColor: theme.searchBackground }}>
        <AntDesign name="search1" size={18} style={{ ...styles.searchIcon, color: theme.primaryText }} />

        <TextInput
          style={{ ...styles.searchInput, color: theme.primaryText }}
          value={search}
          onChangeText={(text) => setSearch(text)}
          placeholder="Search"
          placeholderTextColor={theme.secondaryText}
          keyboardType="default"
        />
      </View>

      <FlatList keyExtractor={(item, index) => index.toString()} data={listChats} renderItem={renderItem} />
    </View>
  );
};

export default HomeChat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    width: windowWidth,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    fontSize: 14,
    opacity: 1.7,
    height: windowHeight / 18,
    width: windowWidth / 1.8,
  },
  searchIcon: {
    marginRight: 10,
  },
  listItem: {
    paddingVertical: 7,
    marginVertical: 2,
  },
  listItemTitle: {
    fontSize: 14,
  },
  listItemSubtitle: {
    fontSize: 12,
  },
});

const fetchUser = async (id) => {
  try {
    const docRef = doc(database, "users", id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return null;
    }
    return docSnap.data();
  } catch (error) {
    console.error("fetchUser, Error getting document:", error);
    return null;
  }
};
