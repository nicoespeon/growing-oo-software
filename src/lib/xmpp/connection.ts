export { Connection, Chat, Message, MessageListener };

class Connection {
  constructor(hostName: string) {}
  connect() {}
  login(login: string, password: string, resource: string) {}
  getChatManager(): ChatManager {
    return new ChatManager();
  }
  disconnect() {}
}

class ChatManager {
  addChatListener(listener: ChatListener) {}
}

interface ChatListener {
  chatCreated: (chat: Chat, createdLocally: boolean) => void;
}

class Chat {
  addMessageListener(listener: MessageListener) {}
  sendMessage(message: Message) {}
}

class Message {}

interface MessageListener {
  processMessage: (chat: Chat, message: Message) => void;
  receivesAMessage: () => void;
}
