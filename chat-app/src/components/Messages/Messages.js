import React from "react";
import { Segment, Comment } from "semantic-ui-react";
import { connect } from "react-redux";
import { setUserPosts } from "../../actions";
import firebase from "../../firebase";

import MessagesHeader from "./MessagesHeader";
import MessageForm from "./MessageForm";
import Message from "./Message";
import Typing from "./Typing";
import Skeleton from "./Skeleton";

class Messages extends React.Component 
{
	state = 
	{
		privateChannel: this.props.isPrivateChannel,
		privateMessagesRef: firebase.database().ref("privateMessages"),
		messagesRef: firebase.database().ref("messages"),
		messages: [],
		messagesLoading: true,
		channel: this.props.currentChannel,
		isChannelStarred: false,
		user: this.props.currentUser,
		usersRef: firebase.database().ref("users"),
		numUniqueUsers: "",
		searchTerm: "",
		searchLoading: false,
		searchResults: [],
		typingRef: firebase.database().ref("typing"),
		typingUsers: [],
		connectedRef: firebase.database().ref(".info/connected"),
		listeners: [],
		initialMessageLoad: true
	};

	componentDidMount() 
	{
		const { channel, user, listeners } = this.state;
		
		if(channel && user)
		{
			this.removeListeners(listeners);
			this.addListeners(channel.id);
			this.addUserStarsListener(channel.id, user.uid);
		}
	}

	componentWillUnmount() 
	{
		this.removeListeners(this.state.listeners);

		this.state.connectedRef.off();
	}

	componentDidUpdate(prevProps, prevState) 
	{
		if(this.messagesEnd)
		this.scrollToBottom();
	}

	addListeners = channelId => 
	{
		this.addMessageListener(channelId);
		this.addTypingListeners(channelId);
	}

	getMessagesRef = () => 
	{
		const { messagesRef, privateMessagesRef, privateChannel } = this.state;

		return privateChannel ? privateMessagesRef : messagesRef;
	}

	addMessageListener = channelId => 
	{
		let loadedMessages = [];
		
		const ref = this.getMessagesRef();

		// console.log({channelId});
		
		ref.child(channelId).on("child_added", snap =>
		{
			// console.log("snap : ",snap.val());

			// console.log("loaded 1 : ",loadedMessages);

			loadedMessages.push({...snap.val(), id: snap.key});
			
			this.setState(
			{
				messages: loadedMessages,
				messagesLoading: false,
			})

			this.countUniqueUsers(loadedMessages);
			this.countUserPosts(loadedMessages);
		})
		
		this.addToListeners(channelId, ref, "child_added");

		ref.child(channelId).on("child_removed", snap =>
		{
			loadedMessages = loadedMessages.filter(message => message.id !== snap.key)
			
			this.setState(
			{
				messages: loadedMessages,
				messagesLoading: false
			})

			this.countUniqueUsers(loadedMessages);
			this.countUserPosts(loadedMessages);
		})

		this.addToListeners(channelId, ref, "child_removed");
		
		// You can use the value event to read a static snapshot of the contents at a given path, as they existed at the time of the event. 
		// This method is triggered once when the listener is attached and again every time the data, including children, changes. The event
		// callback is passed a snapshot containing all data at that location, including child data. If there is no data, the snapshot will
		// return false when you call exists() and null when you call val() on it. 
		
		// It will also be called whenever any new child is added or any one of the old children is removed.
		ref.child(channelId).on("value", snap =>
		{
			if(!this.state.initialMessageLoad)
			{
				// snap.val() is an object which contains all messages (with the updated one) at the given location.
				const updatedMessages = snap.val();
			
				loadedMessages = [];

				for(let message in updatedMessages)
				{
					loadedMessages.push({ ...updatedMessages[message], id: message })	
				}
			
				this.setState(
				{
					messages: loadedMessages,
					messagesLoading: false
				})

				this.countUniqueUsers(loadedMessages);
				this.countUserPosts(loadedMessages);
			}
			else
			{
				this.setState(
				{
					initialMessageLoad: false,
					messagesLoading: false
				})
			}
		})

		this.addToListeners(channelId, ref, "value");
	}

	addTypingListeners = channelId => 
	{
		let typingUsers = [];

		this.state.typingRef.child(channelId).on("child_added", snap => 
		{
			// console.log("Snap : ",snap);

			if(snap.key !== this.state.user.uid) 
			{
				// concat() function is used to Combines two or more arrays.
				typingUsers = typingUsers.concat(
				{
					id: snap.key,
					name: snap.val()
				})

				this.setState({ typingUsers });
			}
		})
		
		this.addToListeners(channelId, this.state.typingRef, "child_added");

		this.state.typingRef.child(channelId).on("child_removed", snap => 
		{
			const index = typingUsers.findIndex(user => user.id === snap.key);

			if(index !== -1) 
			{
				typingUsers = typingUsers.filter(user => user.id !== snap.key);

				this.setState({ typingUsers });
			}
		})

		this.addToListeners(channelId, this.state.typingRef, "child_removed");

		this.state.connectedRef.on("value", snap => 
		{
			// console.log("i1 : ",snap.val())

			if(snap.val() === true) 
			{
				// console.log("i2")
				
				this.state.typingRef.child(channelId).child(this.state.user.uid).onDisconnect().remove(error => 
				{
					if(error !== null)
					console.error(error);
				})
			}
		})
	}

	addUserStarsListener = (channelId, userId) => 
	{
		this.state.usersRef.child(userId).child("starred").once("value")
		.then(data => 
		{
			// data.val() will be an object of ids of starred (marked as star) channels.
			if(data.val() !== null) 
			{
				const channelIds = Object.keys(data.val());

				// Seeing that previously the current channel is starred or not.
				const prevStarred = channelIds.includes(channelId);

				this.setState({ isChannelStarred: prevStarred });
			}
		})
	}

	addToListeners = (id, ref, event) => 
	{
		const index = this.state.listeners.findIndex(
			listener => listener.id === id && listener.ref === ref && listener.event === event
		);

		if(index === -1) 
		{
			const newListener = { id, ref, event };

			this.setState({ listeners: this.state.listeners.concat(newListener) });
		}
	}

	scrollToBottom = () => 
	{
		this.messagesEnd.scrollIntoView({ behavior: "smooth" });
	}

	removeListeners = listeners => 
	{
		listeners.forEach(listener => 
		{
			listener.ref.child(listener.id).off(listener.event);
		})
	}

	handleStar = () => 
	{
		this.setState(prevState => (
		{
			isChannelStarred: !prevState.isChannelStarred

		}), () => this.starChannel());
	}

	starChannel = () => 
	{
		if(this.state.isChannelStarred) 
		{
			this.state.usersRef.child(`${this.state.user.uid}/starred`).update(
			{
				[this.state.channel.id]: 
				{
					name: this.state.channel.name,
					details: this.state.channel.details,
					createdBy: 
					{
						name: this.state.channel.createdBy.name,
						avatar: this.state.channel.createdBy.avatar
					}
				}
			})
		} 
		else 
		{
			this.state.usersRef.child(`${this.state.user.uid}/starred`).child(this.state.channel.id).remove(error => 
			{
				if(error !== null)
				console.error(error);
			})
		}
	}

	handleSearchChange = event => 
	{
		this.setState(
		{
			searchTerm: event.target.value,
			searchLoading: true

		}, () => this.handleSearchMessages());
	}

	handleSearchMessages = () => 
	{
		const channelMessages = [...this.state.messages];
		const regex = new RegExp(this.state.searchTerm, "gi");

		const searchResults = channelMessages.reduce((acc, message) => 
		{
			if((message.content && message.content.match(regex)) || message.user.name.match(regex)) 
			{
				acc.push(message);
			}
		
			return acc;

		}, []);

		this.setState({ searchResults });

		setTimeout(() => this.setState({ searchLoading: false }), 1000);
	}

	countUniqueUsers = messages => 
	{
		const uniqueUsers = messages.reduce((acc, message) => 
		{
			if(!acc.includes(message.user.name)) 
			{
				acc.push(message.user.name);
			}

			return acc;

		}, []);

		const plural = uniqueUsers.length > 1 || uniqueUsers.length === 0;
		const numUniqueUsers = `${uniqueUsers.length} user${plural ? "s" : ""}`;

		this.setState({ numUniqueUsers });
	}

	countUserPosts = messages => 
	{
		let userPosts = messages.reduce((acc, message) => 
		{
			if(message.user.name in acc) 
			{
				acc[message.user.name].count += 1;
			} 
			else 
			{
				acc[message.user.name] = 
				{
					avatar: message.user.avatar,
					count: 1
				};
			}

			return acc;

		}, {});

		this.props.setUserPosts(userPosts);
	}

	displayMessages = messages =>
	{
		return (
			messages.length && messages.map(message => (
				<Message
					key = { message.timestamp }
					message = { message }
					user = { this.state.user }
				/>
			))
		);
	}
	

	displayChannelName = channel => 
	{
		return channel ? `${this.state.privateChannel ? "@" : "#"}${ channel.name }` : "";
	}

	displayTypingUsers = users => 
	{ 
		return ( 
			users.length && 
			<div style = {{ display: "flex", alignItems: "center", marginBottom: "0.2em" }} >
				<span className="user__typing">{ users[users.length-1].name } is typing</span> 
				<Typing />
			</div>
		);
	}

	displayMessageSkeleton = loading => 
	{ 
		return (
			loading ?
				<React.Fragment>
				{
					[...Array(10)].map((_, ind) => (
						<Skeleton key = { ind } />
					))
				}
				</React.Fragment>
			: null
		);
	}

	render() 
	{
		const { 
			messagesRef,
			messages, 
			channel, 
			user, 
			numUniqueUsers, 
			searchTerm, 
			searchResults, 
			searchLoading, 
			privateChannel, 
			isChannelStarred, 
			typingUsers, 
			messagesLoading 

		} = this.state;
	
		return (
			<React.Fragment>

				<MessagesHeader
					channelName = { this.displayChannelName(channel) }
					numUniqueUsers = { numUniqueUsers }
					handleSearchChange = { this.handleSearchChange } 
					searchLoading = { searchLoading }
					isPrivateChannel = { privateChannel }
					handleStar = { this.handleStar }
					isChannelStarred = { isChannelStarred }
				/>

				<Segment>
					<Comment.Group className="messages">
						{ this.displayMessageSkeleton(messagesLoading) }
						{ searchTerm ? this.displayMessages(searchResults) : this.displayMessages(messages) }
						{ this.displayTypingUsers(typingUsers) }
						<div ref = { node => (this.messagesEnd = node) } />
					</Comment.Group>
				</Segment>

				<MessageForm
					messagesRef = { messagesRef }
					currentChannel = { channel }
					currentUser = { user }
					isPrivateChannel = { privateChannel }
					getMessagesRef = { this.getMessagesRef }
				/>
			</React.Fragment>
		);
	}
}

export default connect(null, { setUserPosts })(Messages);