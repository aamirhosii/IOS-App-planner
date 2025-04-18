import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { LinearGradient } from "expo-linear-gradient"

export default function WelcomeScreen() {
  const navigation = useNavigation()

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#ffffff", "#f0f9ff"]} style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image source={{ uri: "https://placeholder.svg?height=100&width=100&query=PD" }} style={styles.logo} />
            <Text style={styles.appName}>PlanDropper</Text>
          </View>

          <View style={styles.heroContainer}>
            <Text style={styles.heroTitle}>Drop your plans.</Text>
            <Text style={styles.heroTitle}>Connect with others.</Text>
            <Text style={styles.heroSubtitle}>Share what you're doing and find people to join you.</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.signInButton} onPress={() => navigation.navigate("Login" as never)}>
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.signUpButton} onPress={() => navigation.navigate("Signup" as never)}>
              <Text style={styles.signUpText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: "contain",
  },
  appName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#3b82f6",
    marginTop: 16,
  },
  heroContainer: {
    alignItems: "center",
    marginVertical: 40,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1e3a8a",
    textAlign: "center",
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: 18,
    color: "#64748b",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 26,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  signInButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  signUpButton: {
    backgroundColor: "white",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  signUpText: {
    color: "#334155",
    fontSize: 18,
    fontWeight: "600",
  },
})
