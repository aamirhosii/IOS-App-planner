import { View, StyleSheet, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "@react-navigation/native"

export default function CreatePlanButton() {
  const navigation = useNavigation()

  const handlePress = () => {
    // This would navigate to a create plan screen
    // For now, just show an alert
    alert("Create Plan functionality would go here")
  }

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.button}>
        <Ionicons name="add" size={30} color="white" />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    bottom: 10,
  },
})
