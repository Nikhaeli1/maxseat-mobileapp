import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen      from '../screens/passenger/HomeScreen';
import MapScreen       from '../screens/passenger/MapScreen';
import MyReportsScreen from '../screens/passenger/MyReportsScreen';
import ProfileScreen   from '../screens/passenger/ProfileScreen';
import { COLORS, ROLE , FONTS} from '../theme';

const Tab = createBottomTabNavigator();
const T   = ROLE.passenger;

function TabIcon({ icon, focused, label }) {
  return (
    <View style={[tabStyles.iconWrap, focused && { backgroundColor: T.primary + '18' }]}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{icon}</Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: { width: 40, height: 28, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
});

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
        tabBarActiveTintColor:   T.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle:        { fontSize: 10, fontFamily: 'PlusJakartaSans_SemiBold', fontWeight: '700', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen
        name="PUVs"
        component={HomeScreen}
        options={{
          tabBarLabel: 'PUVs',
          tabBarIcon: ({ focused }) => <TabIcon icon="🚌" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapScreen}
        options={{
          tabBarLabel: 'Live Map',
          tabBarIcon: ({ focused }) => <TabIcon icon="🗺" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Reports"
        component={MyReportsScreen}
        options={{
          tabBarLabel: 'My Reports',
          tabBarIcon: ({ focused }) => <TabIcon icon="📢" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon icon="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
