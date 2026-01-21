import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from 'contexts/AuthContext';
import { subscribeToChatMessages, sendChatMessage, markAllMessagesAsRead, setTypingStatus, subscribeToTypingStatus, uploadFile, onMessageListener } from 'services/firebase';



// UI Components
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Fab,
    Badge,
    Avatar,
    useTheme,
    Tooltip,
    CircularProgress
} from '@mui/material';
import {
    IconMessageDots,
    IconSend,
    IconX,
    IconCheck,
    IconChecks,
    IconPaperclip,
    IconPhoto,
    IconTrash
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWidget = () => {
    const theme = useTheme();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const [isSending, setIsSending] = useState(false);
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);

    // File Upload State
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    // Subscribe to messages
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToChatMessages((fetchedMessages) => {
            setMessages(fetchedMessages);
        });
        return () => unsubscribe();
    }, [user]);

    // Notification Logic (Foreground FCM)
    useEffect(() => {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        const unsubscribe = onMessageListener((payload) => {
            console.log('FCM Message received in foreground:', payload);
            const { title, body } = payload.notification;

            // Show notification if chat is closed or window is hidden
            if (!isOpen || document.hidden) {
                if (Notification.permission === 'granted') {
                    const notification = new Notification(title, {
                        body: body,
                        icon: '/favicon.ico',
                        tag: 'chat-message'
                    });

                    notification.onclick = () => {
                        window.focus();
                        setIsOpen(true);
                    };
                }
            }
        });

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [isOpen]);

    // Subscribe to typing status
    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToTypingStatus((users) => {
            // Filter out self
            setTypingUsers(users.filter(u => u.uid !== user.uid));
        });
        return () => unsubscribe();
    }, [user]);

    // Calculate unread count
    const unreadCount = useMemo(() => {
        if (!user) return 0;
        return messages.filter(m => !m.readBy?.includes(user.uid)).length;
    }, [messages, user]);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
            // Mark visible messages as read when open
            if (unreadCount > 0 && user) {
                markAllMessagesAsRead(messages, user.uid);
            }
        }
    }, [messages, isOpen, user, unreadCount]);

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!inputValue.trim() && !selectedFile) || !user) return;

        setIsSending(true);
        try {
            let media = null;

            // Upload file if selected
            if (selectedFile) {
                const downloadUrl = await uploadFile(selectedFile);
                if (downloadUrl) {
                    const type = selectedFile.type.startsWith('image/') ? 'image' : 'video';
                    media = { type, url: downloadUrl };
                }
            }

            await sendChatMessage(inputValue, user, media);

            setInputValue('');
            handleClearFile(); // Reset file selection


            // Clear typing status immediately on send
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            setTypingStatus(user, false);

        } catch (error) {
            console.error("Failed to send", error);
        } finally {
            setIsSending(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputValue(val);

        if (!user) return;

        // If we were not typing previously (or timeout cleared), set status true
        setTypingStatus(user, true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setTypingStatus(user, false);
        }, 2000);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Simple validation
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (isImage || isVideo) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        } else {
            alert('Please select an image or video file.');
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Toggle Chat

    // Toggle Chat
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    // --- RENDER HELPERS ---

    const renderMessageStatus = (msg) => {
        // Group chat logic: 
        // 1 tick (sent) - always true if in list
        // 2 ticks (read by someone else?) - loosely, if readBy.length > 1
        // Blue ticks (read by everyone?) - hard to know total users count here easily without huge query.
        // Let's stick to: 
        // 1 Grey Tick: Sent
        // 2 Blue Ticks: Read by at least one other person (showing "Seen")

        const isReadByOthers = msg.readBy?.some(uid => uid !== user?.uid);

        if (isReadByOthers) {
            return <IconChecks size={16} color={theme.palette.primary.main} />;
        }
        return <IconCheck size={16} color={theme.palette.grey[500]} />;
    };

    if (!user) return null; // Don't show if not logged in

    return (
        <>
            {/* FLOATING ACTION BUTTON */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        style={{
                            position: 'fixed',
                            bottom: 30,
                            right: 30,
                            zIndex: 1200
                        }}
                    >
                        <Tooltip title="Team Chat" placement="left">
                            <Fab
                                color="primary"
                                aria-label="chat"
                                onClick={toggleChat}
                                sx={{
                                    bgcolor: theme.palette.secondary.dark,
                                    '&:hover': { bgcolor: theme.palette.secondary.main },
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                                }}
                            >
                                <Badge badgeContent={unreadCount} color="error">
                                    <IconMessageDots size={30} />
                                </Badge>
                            </Fab>
                        </Tooltip>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CHAT WINDOW */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        transition={{ type: "spring", damping: 20, stiffness: 100 }}
                        style={{
                            position: 'fixed',
                            bottom: 30,
                            right: 30,
                            zIndex: 1200,
                            width: '380px',
                            maxWidth: '90vw',
                            height: '600px',
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        <Paper
                            elevation={12}
                            sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                borderRadius: '16px',
                                border: `1px solid ${theme.palette.divider}`,
                                backdropFilter: 'blur(20px)',
                                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 30, 40, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                            }}
                        >
                            {/* HEADER */}
                            <Box sx={{
                                p: 2,
                                background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.primary.dark} 100%)`,
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                                        <IconMessageDots size={24} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" color="inherit" sx={{ fontWeight: 600 }}>Team Chat</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8 }}>Online</Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={toggleChat} size="small" sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                                    <IconX size={20} />
                                </IconButton>
                            </Box>

                            {/* MESSAGES AREA */}
                            <Box sx={{
                                flex: 1,
                                overflowY: 'auto',
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 2, // Space between messages
                                bgcolor: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f5f7fa',
                                backgroundImage: 'radial-gradient(#e0e0e0 1px, transparent 1px)', // Subtle pattern
                                backgroundSize: '20px 20px'
                            }}>
                                {messages.length === 0 && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', opacity: 0.5 }}>
                                        <Typography variant="body2">No messages yet. Start the conversation!</Typography>
                                    </Box>
                                )}

                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === user.uid;
                                    const isContinuous = index > 0 && messages[index - 1].senderId === msg.senderId;

                                    return (
                                        <Box
                                            key={msg.id}
                                            sx={{
                                                alignSelf: isMe ? 'flex-end' : 'flex-start',
                                                maxWidth: '75%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: isMe ? 'flex-end' : 'flex-start'
                                            }}
                                        >
                                            {!isMe && !isContinuous && (
                                                <Typography variant="caption" sx={{ ml: 1, mb: 0.5, color: theme.palette.text.secondary, fontWeight: 500 }}>
                                                    {msg.senderName}
                                                </Typography>
                                            )}

                                            <Box sx={{
                                                p: 1.5,
                                                px: 2,
                                                bgcolor: isMe ? theme.palette.secondary.main : theme.palette.background.paper,
                                                color: isMe ? 'white' : theme.palette.text.primary,
                                                borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                                position: 'relative'
                                            }}>
                                                {/* Add Media Rendering */}
                                                {msg.media && (
                                                    <Box sx={{ mb: msg.text ? 1 : 0, mt: 0.5 }}>
                                                        {msg.media.type === 'image' ? (
                                                            <Box
                                                                component="img"
                                                                src={msg.media.url}
                                                                alt="attachment"
                                                                sx={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: 200,
                                                                    borderRadius: '8px',
                                                                    cursor: 'pointer'
                                                                }}
                                                                onClick={() => window.open(msg.media.url, '_blank')}
                                                            />
                                                        ) : (
                                                            <Box
                                                                component="video"
                                                                src={msg.media.url}
                                                                controls
                                                                sx={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: 200,
                                                                    borderRadius: '8px'
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                )}

                                                <Typography variant="body1" sx={{ lineHeight: 1.4 }}>{msg.text}</Typography>

                                                <Box sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'flex-end',
                                                    gap: 0.5,
                                                    mt: 0.5,
                                                    opacity: 0.8
                                                }}>
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </Typography>
                                                    {isMe && renderMessageStatus(msg)}
                                                </Box>
                                            </Box>
                                        </Box>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                                <div ref={messagesEndRef} />
                            </Box>

                            {/* TYPING INDICATOR */}
                            {typingUsers.length > 0 && (
                                <Box sx={{
                                    px: 2,
                                    py: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    bgcolor: theme.palette.background.paper,
                                    borderTop: `1px solid ${theme.palette.divider}`
                                }}>
                                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ repeat: Infinity, duration: 0.8 }}
                                        >
                                            typing...
                                        </motion.span>
                                        <span style={{ fontWeight: 600 }}>
                                            {typingUsers.length === 1
                                                ? `${typingUsers[0].name} is typing...`
                                                : `${typingUsers.length} people are typing...`}
                                        </span>
                                    </Typography>
                                </Box>
                            )}

                            {/* INPUT AREA */}
                            <Box
                                component="form"
                                onSubmit={handleSend}
                                sx={{
                                    p: 2,
                                    bgcolor: theme.palette.background.paper,
                                    borderTop: `1px solid ${theme.palette.divider}`,
                                    display: 'flex',
                                    gap: 1,
                                    flexDirection: 'column' // Support preview area stacking
                                }}
                            >
                                {/* FILE PREVIEW AREA */}
                                {selectedFile && (
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        p: 1,
                                        borderRadius: 2,
                                        mb: 1
                                    }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {selectedFile.type.startsWith('image/') ? (
                                                <Avatar src={previewUrl} variant="rounded" sx={{ width: 40, height: 40 }} />
                                            ) : (
                                                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'rgba(0,0,0,0.1)' }}>
                                                    <IconPhoto /> {/* Placeholder for video icon if needed */}
                                                </Avatar>
                                            )}
                                            <Box sx={{ overflow: 'hidden' }}>
                                                <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>{selectedFile.name}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <IconButton size="small" onClick={handleClearFile}>
                                            <IconTrash size={18} />
                                        </IconButton>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <input
                                        type="file"
                                        accept="image/*,video/*"
                                        style={{ display: 'none' }}
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                    <IconButton
                                        disabled={isSending}
                                        onClick={() => fileInputRef.current?.click()}
                                        sx={{
                                            color: theme.palette.grey[500],
                                            '&:hover': { color: theme.palette.primary.main, bgcolor: theme.palette.primary.light }
                                        }}
                                    >
                                        <IconPaperclip size={22} />
                                    </IconButton>
                                    <TextField
                                        fullWidth
                                        placeholder="Type a message..."
                                        variant="outlined"
                                        size="small"
                                        value={inputValue}
                                        onChange={handleInputChange}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '24px',
                                                bgcolor: theme.palette.background.default
                                            }
                                        }}
                                    />
                                    <IconButton
                                        color="secondary"
                                        type="submit"
                                        disabled={(!inputValue.trim() && !selectedFile) || isSending}
                                        sx={{
                                            bgcolor: theme.palette.secondary.light,
                                            color: theme.palette.secondary.dark,
                                            '&:hover': { bgcolor: theme.palette.secondary[200] },
                                            width: 40,
                                            height: 40
                                        }}
                                    >
                                        {isSending ? <CircularProgress size={20} /> : <IconSend size={20} />}
                                    </IconButton>
                                </Box>
                            </Box>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatWidget;
