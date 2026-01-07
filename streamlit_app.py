# -*- coding: utf-8 -*-
import streamlit as st

# App title
st.set_page_config(page_title="Basic Chatbot", layout="centered")
st.title("🤖 Basic Chatbot")

# Initialize chat history
if "messages" not in st.session_state:
    st.session_state.messages = []

# Display previous messages
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

# User input
user_input = st.chat_input("Type your message...")

if user_input:
    # Save user message
    st.session_state.messages.append(
        {"role": "user", "content": user_input}
    )

    # Simple rule-based bot response
    if user_input.lower() in ["hi", "hello"]:
        bot_reply = "Hello! How can I help you?"
    elif user_input.lower() in ["how are you"]:
        bot_reply = "I'm doing great 😊"
    elif user_input.lower() in ["bye", "exit"]:
        bot_reply = "Goodbye! Have a nice day 👋"
    else:
        bot_reply = "Sorry, I didn't understand that."

    # Save bot response
    st.session_state.messages.append(
        {"role": "assistant", "content": bot_reply}
    )

    # Display bot response
    with st.chat_message("assistant"):
        st.markdown(bot_reply)
