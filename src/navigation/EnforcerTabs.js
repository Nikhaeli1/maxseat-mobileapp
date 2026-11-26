import React, { useEffect } from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DispatchScreen         from '../screens/enforcer/DispatchScreen';
import PassengerReportsScreen from '../screens/enforcer/PassengerReportsScreen';
import { fetchPassengerReports } from '../api/apiService';
import useLiveData from '../hooks/useLiveData';
import { publishNewReports, useNewReports } from '../hooks/reportBadge';
import { COLORS, IS_DARK, SHADOW, themed } from '../theme';
import Icon from '../components/Icon';

const Tab = createBottomTabNavigator();

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

export default function EnforcerTabs() {
  // Number on the Reports tab: new passenger reports nobody has looked at yet
  const live  = useLiveData(fetchPassengerReports, { interval: 30000 });
  useEffect(() => { if (live.data?.counts) publishNewReports(live.data.counts.open); }, [live.data]);
  const fresh = useNewReports();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.cardBg,
          borderTopColor:  COLORS.border,
          borderTopWidth:  1,
          height:          76,
          paddingBottom:   12,
          paddingTop:      8,
          ...SHADOW.md,
        },
        tabBarActiveTintColor:   IS_DARK ? COLORS.alert : COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle:        { fontSize: 12, fontFamily: 'Outfit_SemiBold', fontWeight: '700', letterSpacing: 0.3 },
      }}
    >
      <Tab.Screen
        name="Dispatch"
        component={DispatchScreen}
        options={{
          tabBarLabel: 'Dispatch',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="shield-checkmark" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="PassengerReports"
        component={PassengerReportsScreen}
        options={{
          tabBarLabel: 'Passenger reports',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="megaphone" focused={focused} color={color} />,
          tabBarBadge: fresh > 0 ? (fresh > 99 ? '99+' : fresh) : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.alert, color: COLORS.onAlert, fontFamily: 'Outfit_ExtraBold', fontWeight: '800', fontSize: 11 },
        }}
      />
    </Tab.Navigator>
  );
}
