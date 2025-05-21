import React, { useState, useRef, useEffect } from "react";
import {
  ChakraProvider,
  Box,
  Flex,
  Button,
  Input,
  useColorMode,
  useColorModeValue,
  Text,
  VStack,
  HStack,
  Avatar,
  Spacer,
  IconButton,
} from "@chakra-ui/react";
import { MoonIcon, SunIcon } from "@chakra-ui/icons";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:4000";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  function handleLogin(e) {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  }
  return (
    <Flex minH="100vh" align="center" justify="center" bg={useColorModeValue("gray.100", "gray.800")}>
      <Box bg={useColorModeValue("white", "gray.700")} p={8} rounded="md" shadow="md" minW="320px">
        <Text fontWeight="bold" fontSize="2xl" mb={6} textAlign="center">
          New Chat Elite
        </Text>
        <form onSubmit={handleLogin}>
          <VStack spacing={4}>
            <Input
              placeholder="Enter a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
            />
            <Button type="submit" colorScheme="blue" width="full">
              Log In
            </Button>
          </VStack>
        </form>
      </Box>
    </Flex>
  );
}

function Sidebar() {
  return (
    <Box
      w="72px"
      bg={useColorModeValue("gray.200", "gray.900")}
      borderRightWidth="1px"
      h="100vh"
      p={2}
      display="flex"
      flexDir="column"
      alignItems="center"
      gap={2}
    >
      <Avatar name="A" size="md" />
      <Avatar name="B" size="md" />
      <Avatar name="C" size="md" />
      <Spacer />
    </Box>
  );
}

function ChannelBar() {
  return (
    <Box
      w="240px"
      bg={useColorModeValue("gray.100", "gray.800")}
      borderRightWidth="1px"
      h="100vh"
      p={4}
    >
      <VStack align="start" spacing={4}>
        <Text fontWeight="bold"># general</Text>
        <Text color="gray.500" fontSize="sm"># random</Text>
      </VStack>
    </Box>
  );
}

function TopBar({ username }) {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <Flex
      h="56px"
      align="center"
      px={4}
      borderBottomWidth="1px"
      bg={useColorModeValue("white", "gray.700")}
      justify="space-between"
    >
      <Text fontWeight="bold"># general</Text>
      <HStack spacing={2}>
        <Text color="gray.500" fontSize="sm">
          {username}
        </Text>
        <Avatar name={username} size="sm" />
        <IconButton
          icon={colorMode === "dark" ? <SunIcon /> : <MoonIcon />}
          onClick={toggleColorMode}
          size="sm"
          aria-label="Toggle color mode"
        />
      </HStack>
    </Flex>
  );
}

function ChatArea({ messages, username, onSend }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend({ user: username, text });
    setInput("");
  }

  return (
    <Flex direction="column" h="calc(100vh - 56px)" bg={useColorModeValue("gray.50", "gray.800")} p={6}>
      <VStack align="start" spacing={4} flex="1" overflowY="auto">
        {messages.length === 0 ? (
          <Text color="gray.400" fontStyle="italic" alignSelf="center">
            No messages yet. Say something!
          </Text>
        ) : (
          messages.map((msg, idx) => (
            <HStack key={idx} align="flex-start">
              <Avatar name={msg.user} size="sm" />
              <Box>
                <Text fontWeight="bold" fontSize="sm">{msg.user}</Text>
                <Text>{msg.text}</Text>
              </Box>
            </HStack>
          ))
        )}
        <div ref={messagesEndRef} />
      </VStack>
      <Box mt={4} as="form" onSubmit={handleSend}>
        <HStack>
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            autoComplete="off"
          />
          <Button type="submit" colorScheme="blue">
            Send
          </Button>
        </HStack>
      </Box>
    </Flex>
  );
}

function UserList({ users }) {
  return (
    <Box
      w="240px"
      bg={useColorModeValue("gray.100", "gray.800")}
      borderLeftWidth="1px"
      h="100vh"
      p={4}
      overflowY="auto"
    >
      <Text fontWeight="bold" mb={4}>
        Online Users
      </Text>
      <VStack align="start" spacing={3}>
        {users.length === 0 ? (
          <Text color="gray.400" fontStyle="italic">No users online</Text>
        ) : (
          users.map((username, idx) => (
            <HStack key={idx} spacing={3}>
              <Avatar name={username} size="sm" />
              <Text>{username}</Text>
            </HStack>
          ))
        )}
      </VStack>
    </Box>
  );
}

function MainLayout({ username }) {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_SERVER_URL);

    // Announce yourself to the server
    socketRef.current.emit("join", username);

    // Listen for messages
    socketRef.current.on("chat message", (msg) => {
      setMessages((msgs) => [...msgs, msg]);
    });

    // Listen for user list updates
    socketRef.current.on("userlist", (userList) => {
      setUsers(userList);
    });

    // On disconnect, clean up
    return () => {
      socketRef.current.disconnect();
    };
  }, [username]);

  function handleSend(msg) {
    socketRef.current.emit("chat message", msg);
  }

  return (
    <Flex minH="100vh">
      <Sidebar />
      <ChannelBar />
      <Flex direction="column" flex="1">
        <TopBar username={username} />
        <ChatArea messages={messages} username={username} onSend={handleSend} />
      </Flex>
      <UserList users={users} />
    </Flex>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <ChakraProvider>
      {user ? <MainLayout username={user} /> : <Login onLogin={setUser} />}
    </ChakraProvider>
  );
}