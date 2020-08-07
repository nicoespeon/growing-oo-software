export { Connection, Chat, Message, MessageListener };

// Store connections in memory so we can simulate they connect to the same hostname
const connections = new Map<string, Connection>();

class Connection {
  private chatManager: ChatManager | null = null;

  constructor(
    private hostName: string,
    public readonly user: string = "user not set"
  ) {
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

  login(username: string, password: string, resource: string) {}

  getChatManager(): ChatManager {
    if (!this.chatManager) {
      this.chatManager = new ChatManager(this.user);
    }

    return this.chatManager;
  }

  disconnect() {
    this.chatManager.disconnect();
  }
}

class ChatManager {
  private chats = new Map<string, Chat>();
  private chatListeners: ChatListener[] = [];

  constructor(private readonly participant: string) {}

  addChatListener(listener: ChatListener) {
    this.chatListeners.push(listener);
  }

  createChat(id: string, listener?: MessageListener): Chat {
    let chat = this.chats.get(id);

    if (!chat) {
      chat = new Chat(this.participant);
      if (listener) {
        chat.addMessageListener(listener);
      }

      this.chats.set(id, chat);

      // Assign 1 chat listener / created chat, FIFO
      const chatListener = this.chatListeners.shift();
      if (chatListener) {
        chatListener.chatCreated(chat, true);
      }
    }

    return chat;
  }

  disconnect() {
    this.chats.clear();
  }
}

interface ChatListener {
  chatCreated: (chat: Chat, createdLocally: boolean) => void;
}

class Chat {
  private listeners: MessageListener[] = [];

  constructor(public readonly participant: string) {}

  addMessageListener(listener: MessageListener) {
    this.listeners.push(listener);
  }

  sendMessage(message: string) {
    this.listeners.forEach((listener) =>
      listener.processMessage(this, new Message(message))
    );
  }
}

class Message {
  constructor(public readonly body: string = "") {}
}

interface MessageListener {
  processMessage: (chat: Chat, message: Message) => void;
}
