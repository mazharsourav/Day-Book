import { useColors } from "@/hooks/useColors";
import { Tabs } from "expo-router";
import { Calendar, CircleCheck } from "lucide-react-native";

export default function TabLayout() {
  const c = useColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.ground,
          borderTopColor: c.hairline,
          borderTopWidth: 1,
          elevation: 0,
        },
        tabBarActiveTintColor: c.ink,
        tabBarInactiveTintColor: c.inkMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarAccessibilityLabel: "Today, your list for the day",
          tabBarIcon: ({ color, focused }) => (
            <CircleCheck size={24} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarAccessibilityLabel: "History, monthly calendar",
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={24} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
    </Tabs>
  );
}
