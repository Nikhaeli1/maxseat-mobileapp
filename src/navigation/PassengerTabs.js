import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen      from '../screens/passenger/HomeScreen';
import MapScreen       from '../screens/passenger/MapScreen';
import MyReportsScreen from '../screens/passenger/MyReportsScreen';
import ProfileScreen   from '../screens/passenger/ProfileScreen';
import { COLORS, ROLE , FONTS, themed } from '../theme';
import Icon from '../components/Icon';

const Tab = createBottomTabNavigator();
const T   = ROLE.passenger;

function TabIcon({ icon, focused, color }) {
  return (
    <View style={[tabStyles.iconWrap, focused && { backgroundColor: 'rgba(198,242,78,0.16)' }]}>
      <Icon name={focused ? icon : `${icon}-outline`} size={21} color={color} />
    </View>
  );
}

const tabStyles = themed(() => ({
  iconWrap: { width: 40, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
}));

export default function PassengerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  COLORS.dark,
          borderTopColor:   COLORS.darkMid,
          borderTopWidth:   1,
          height:           68,
          paddingBottom:    10,
          paddingTop:       6,
        },
        // Lime + white on the green bar (green-on-green was hard to see)
        tabBarActiveTintColor:   COLORS.alert,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.7)',
        tabBarLabelStyle:        { fontSize: 10, fontFamily: 'Outfit_SemiBold', fontWeight: '700', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen
        name="PUVs"
        component={HomeScreen}
        options={{
          tabBarLabel: 'PUVs',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="bus" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: 'Live Map',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="map" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'My Reports',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="megaphone" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="person" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
