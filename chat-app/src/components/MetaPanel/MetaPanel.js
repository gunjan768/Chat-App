import React from "react";
import {
	Segment,
	Accordion,
	Header,
	Icon,
	Image,
	List
} from "semantic-ui-react";

class MetaPanel extends React.Component 
{
	state = 
	{
		channel: this.props.currentChannel,
		privateChannel: this.props.isPrivateChannel,
		activeIndex: -1
	};

	setActiveIndex = (event, titleProps) => 
	{
		const { index } = titleProps;
		const { activeIndex } = this.state;

		const newIndex = activeIndex === index ? -1 : index;

		this.setState({ activeIndex: newIndex });
	}

	formatCount = num => (num === 1 ? `${num} post` : `${num} posts`);

	displayTopPosters = posts =>
	{
		return (
			Object.entries(posts).sort((a, b) => b[1] - a[1]).map(([key, val], ind) => (
				<List.Item key = { ind }>
					<Image avatar src = { val.avatar } />
					<List.Content>
						<List.Header as="a">{ key }</List.Header>
						<List.Description>{ this.formatCount(val.count) }</List.Description>
					</List.Content>
				</List.Item>
			)).slice(0, 2)
		);
	}

	render() 
	{
		const { activeIndex, privateChannel, channel } = this.state;
		const { userPosts } = this.props;

		if(privateChannel) 
		return null;

		return (
			<Segment loading = { !channel }>
				
				<Header as="h3" attached="top">About # { channel && channel.name }</Header>
				
					<Accordion styled attached="true">

						<Accordion.Title
							active = { activeIndex === 0 }
							onClick = { this.setActiveIndex }
							index = { 0 }
						> 
							<Icon name="dropdown" /> 
							<Icon name="info" /> Channel Details
						</Accordion.Title>
						
						<Accordion.Content active = { activeIndex === 0 }>
							{ channel && channel.details }
						</Accordion.Content>

						<Accordion.Title
							active = { activeIndex === 1 }
							onClick = { this.setActiveIndex }
							index = { 1 }
						> 
							<Icon name="dropdown" />
							<Icon name="user circle" />Top Posters
						</Accordion.Title>

						<Accordion.Content active = { activeIndex === 1 }>
							<List>{ userPosts && this.displayTopPosters(userPosts) }</List>
						</Accordion.Content>

						<Accordion.Title
							active = { activeIndex === 2 }
							onClick = { this.setActiveIndex }
							index = { 2 }
						>
							<Icon name="dropdown" />
							<Icon name="pencil alternate" />Created By
						</Accordion.Title>

						<Accordion.Content active ={ activeIndex === 2 }>
							<Header as="h3">
								<Image circular src = { channel && channel.createdBy.avatar } />
								{ channel && channel.createdBy.name }
							</Header>
						</Accordion.Content>

				</Accordion>

			</Segment>
		);
	}
}

export default MetaPanel;