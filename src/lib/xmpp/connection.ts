export { Connection, Chat, Message, MessageListener };

// Store connections in memory so we can simulate they connect to the same hostname
const connections = new Map<string, Connection>();

class Connection {
  private _username: string | null;
  private chatManager: ChatManager | null = null;

  constructor(
    private hostName: string,
    private participant: string = "Participant not set"
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

  get user(): string {
    return this._username || "no user connected";
  }

  connect() {}

  login(username: string, password: string, resource: string) {
    this._username = username;
  }

  getChatManager(): ChatManager {
    if (!this.chatManager) {
      this.chatManager = new ChatManager(this.participant);
    }

    return this.chatManager;
  }

  disconnect() {}
}

class ChatManager {
  private chat: Chat;

  constructor(participant: string) {
    this.chat = new Chat(participant);
  }

  addChatListener(listener: ChatListener) {
    listener.chatCreated(this.chat, true);
  }

  createChat(id: string, listener?: MessageListener): Chat {
    if (listener) {
      this.chat.addMessageListener(listener);
    }

    return this.chat;
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
