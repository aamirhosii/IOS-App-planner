import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import HomeScreen from "../screens/HomeScreen"
import MyPlansScreen from "../screens/MyPlansScreen"
import InboxScreen from "../screens/InboxScreen"
import ProfileScreen from "../screens/ProfileScreen"
import CreatePlanButton from "../components/CreatePlanButton"

const Tab = createBottomTabNavigator()

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === "Home") {
            iconName = focused ? "home" : "home-outline"
          } else if (route.name === "MyPlans") {
            iconName = focused ? "calendar" : "calendar-outline"
          } else if (route.name === "Create") {
            iconName = "add-circle"
            return <CreatePlanButton />
          } else if (route.name === "Inbox") {
            iconName = focused ? "chatbubble" : "chatbubble-outline"
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline"
          }

          return <Ionicons name={iconName as any} size={size} color={color} />
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "gray",
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="MyPlans" component={MyPlansScreen} options={{ title: "My Plans" }} />
      <Tab.Screen
        name="Create"
        component={HomeScreen} // This is a placeholder, the actual navigation happens in CreatePlanButton
        options={{
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen name="Inbox" component={InboxScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
