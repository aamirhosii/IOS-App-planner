import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import type { Conversation } from "../types"
import { formatDistanceToNow } from "date-fns"

interface ConversationItemProps {
  conversation: Conversation
  onPress: () => void
}

export default function ConversationItem({ conversation, onPress }: ConversationItemProps) {
  const otherParticipant = conversation.participants?.find((p) => p.user?.id !== conversation.last_message?.sender_id)
  const userName = otherParticipant?.user?.name || "User"
  const initial = userName.charAt(0).toUpperCase()

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.time}>
            {conversation.last_message?.created_at ? formatTime(conversation.last_message.created_at) : ""}
          </Text>
        </View>

        <Text style={styles.message} numberOfLines={1}>
          {conversation.last_message?.content || "No messages yet"}
        </Text>
      </View>

      {conversation.unread_count && conversation.unread_count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{conversation.unread_count}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  time: {
    fontSize: 12,
    color: "#94a3b8",
  },
  message: {
    fontSize: 14,
    color: "#64748b",
  },
  badge: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
})
