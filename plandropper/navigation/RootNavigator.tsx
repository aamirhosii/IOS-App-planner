"use client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuth } from "../contexts/AuthContext"
import AuthStack from "./AuthStack"
import MainTabs from "./MainTabs"
import LoadingScreen from "../screens/LoadingScreen"

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? <Stack.Screen name="Main" component={MainTabs} /> : <Stack.Screen name="Auth" component={AuthStack} />}
    </Stack.Navigator>
  )
}
