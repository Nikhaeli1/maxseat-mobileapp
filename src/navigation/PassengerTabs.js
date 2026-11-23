import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen      from '../screens/passenger/HomeScreen';
import MapScreen       from '../screens/passenger/MapScreen';
import MyReportsScreen from '../screens/passenger/MyReportsScreen';
import ProfileScreen   from '../screens/passenger/ProfileScreen';
import { COLORS, ROLE , FONTS, IS_DARK, SHADOW, themed } from '../theme';
import Icon from '../components/Icon';

const Tab = createBottomTabNavigator();
const T   = ROLE.passenger;

function TabIcon({ icon, focused, color }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconOn]}>
      <Icon name={focused ? icon : `${icon}-outline`} size={22} color={color} />
    </View>
  );
}

const tabStyles = themed(() => ({
  iconWrap: { width: 52, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 16 },
  iconOn:   { backgroundColor: IS_DARK ? 'rgba(198,242,78,0.16)' : 'rgba(47,111,90,0.12)' },
}));

export default function PassengerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        // Clean light bar; the open tab gets a soft green pill
        tabBarStyle: {
          backgroundColor:  COLORS.cardBg,
          borderTopColor:   COLORS.border,
          borderTopWidth:   1,
          height:           76,
          paddingBottom:    12,
          paddingTop:       8,
          ...SHADOW.md,
        },
        tabBarActiveTintColor:   IS_DARK ? COLORS.alert : COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle:        { fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '700', letterSpacing: 0.3 },
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
