export { Connection, Chat, Message, MessageListener };

// Store connections in memory so we can simulate they connect to the same hostname
const connections = new Map<string, Connection>();

class Connection {
  private chatManager: ChatManager | null = null;

  constructor(private hostName: string) {
    // TODO: This should be built with connect() and login() instead
    const existingConnection = connections.get(hostName);
    if (existingConnection) {
      return existingConnection;
    }

    connections.set(hostName, this);
  }

  get serviceName(): string {
    return this.hostName;
  }

  connect() {}

  login(login: string, password: string, resource: string) {}

  getChatManager(): ChatManager {
    if (!this.chatManager) {
      this.chatManager = new ChatManager();
    }

    return this.chatManager;
  }

  disconnect() {}
}

class ChatManager {
  private chat = new Chat();

  addChatListener(listener: ChatListener) {
    listener.chatCreated(this.chat, true);
  }

  createChat(id: string, listener: MessageListener): Chat {
    this.chat.addMessageListener(listener);
    return this.chat;
  }
}

interface ChatListener {
  chatCreated: (chat: Chat, createdLocally: boolean) => void;
}

class Chat {
  private listeners: MessageListener[] = [];

  addMessageListener(listener: MessageListener) {
    this.listeners.push(listener);
  }

  sendMessage(message: Message) {
    this.listeners.forEach((listener) =>
      listener.processMessage(this, message)
    );
  }
}

class Message {}

interface MessageListener {
  processMessage: (chat: Chat, message: Message) => void;
}
