import React from "react";
import firebase from "../../firebase";
import AvatarEditor from "react-avatar-editor";
// prettier-ignore
import { Grid, Header, Icon, Dropdown, Image, Modal, Input, Button } from "semantic-ui-react";

class UserPanel extends React.Component 
{
	state = 
	{
		user: this.props.currentUser,
		modal: false,
		previewImage: "",
		croppedImage: "",
		blob: null,
		uploadedCroppedImage: "",
		storageRef: firebase.storage().ref(),
		userRef: firebase.auth().currentUser,
		usersRef: firebase.database().ref("users"),
		imageLoading: false,
		metadata: 
		{
			contentType: "image/jpeg"
		}
	};

	openModal = () => this.setState({ modal: true });

	closeModal = () => this.setState({ modal: false });

	dropdownOptions = () => 
	{
		return (
		[
			{
				key: "user",
				text: <span>Signed in as <strong>{ this.state.user.displayName }</strong></span>,
				disabled: true
			},
			{
				key: "avatar",
				text: <span onClick = { this.openModal }>Change Avatar</span>
			},
			{
				key: "signout",
				text: <span onClick = { this.handleSignout }>Sign Out</span>
			}
		]);
	}

	uploadCroppedImage = () => 
	{
		this.setState({ imageLoading: true });

		const { storageRef, userRef, blob, metadata } = this.state;

		storageRef.child(`avatars/user/${userRef.uid}`).put(blob, metadata)
		.then(snap => 
		{
			snap.ref.getDownloadURL()
			.then(downloadURL => 
			{
				this.setState({ uploadedCroppedImage: downloadURL }, () => this.changeAvatar());
			})
		})
	}

	changeAvatar = () => 
	{
		// This is userRef.
		this.state.userRef.updateProfile(
		{
			photoURL: this.state.uploadedCroppedImage
		})
		.then(() =>
	 	{
			// console.log("PhotoURL updated");

			this.closeModal();
		})
		.catch(error => 
		{
			console.error(error);
		})

		// This is usersRef ( see 's' at the end of user ).
		this.state.usersRef.child(this.state.user.uid).update({ avatar: this.state.uploadedCroppedImage })
		.then(() => 
		{
			// console.log("User avatar updated");
		})
		.catch(error => 
		{
			console.error(error);
		})

		this.setState(
		{ 
			imageLoading: false,
			previewImage: "",
			croppedImage: ""
		});
	}

	handleChange = event => 
	{
		const file = event.target.files[0];
		
		// Lets web applications asynchronously read the contents of files (or raw data buffers) stored on the user's computer, using File or 
		// Blob objects to specify the file or data to read.
		const reader = new FileReader();

		if(file) 
		{
			// Starts reading the contents of the specified Blob, once finished, the result attribute contains a data: URL representing the 
			// file's data.
			reader.readAsDataURL(file);

			// 'load' isan event which is fired when a read has completed successfully. Also available via the onload property.
			reader.addEventListener("load", () => 
			{
				// console.log(reader.result);

				this.setState({ previewImage: reader.result });
			})
		}
	}

	handleCropImage = () => 
	{
		if(this.avatarEditor) 
		{
			// The HTMLCanvasElement.toBlob() method creates a Blob object representing the image contained in the canvas; this file may be
			// cached on the disk or stored in memory at the discretion of the user agent. If type is not specified, the image type is image/png.
			// The created image is in a resolution of 96dpi.
			this.avatarEditor.getImageScaledToCanvas().toBlob(blob => 
			{
				let imageUrl = URL.createObjectURL(blob);
				
				this.setState(
				{
					croppedImage: imageUrl,
					blob
				})
			})
		}
	}

	handleSignout = () => 
	{
		firebase.auth().signOut().then(() => console.log("signed out!"));
	}

	render() 
	{
		const { user, modal, previewImage, croppedImage, imageLoading } = this.state;
		const { primaryColor } = this.props;

		return (
			<Grid style = {{ background: primaryColor }}>
				<Grid.Column>
				
					<Grid.Row style = {{ padding: "1.2em", margin: 0 }}>
					
						{ /* App Header */ }
						<Header inverted floated="left" as="h2">
							<Icon name="code" />
							<Header.Content>Firebase-Chat</Header.Content>
						</Header>

						{ /* User Dropdown  */ }
						<Header style = {{ padding: "0.25em" }} as="h4" inverted>
							<Dropdown
								trigger = { <span><Image src = { user.photoURL } spaced="right" avatar />{ user.displayName }</span> }
								options = { this.dropdownOptions() }
							/>
						</Header>

					</Grid.Row>

					{ /* Change User Avatar Modal   */ }
					<Modal basic open = { modal } onClose = { this.closeModal }>
						
						<Modal.Header>Change Avatar</Modal.Header>

						<Modal.Content>

							<Input
								onChange = { this.handleChange }
								fluid
								type="file"
								label="New Avatar"
								name="previewImage"
							/>

							<Grid centered stackable columns = { 2 }>	
								<Grid.Row centered>
									
									<Grid.Column className="ui center aligned grid">
									{
										previewImage && 
										<AvatarEditor
											ref = 
											{ 
												node => 
												{ 
													// console.log({node});

													return this.avatarEditor = node;
												}
											}
											image = { previewImage }
											width = { 150 }
											height = { 150 }
											border = { 50 }
											scale = { 1 }
											color = { [255, 255, 255, 0.6] }
											rotate = { 0 }
										/>
									}
									</Grid.Column>

									<Grid.Column>
									{
										croppedImage &&
										<Image
											style = {{ margin: "3.5em auto" }}
											width = { 150 }
											height = { 150 }
											src = { croppedImage }
										/>
									}
									</Grid.Column>

								</Grid.Row>
							</Grid>

						</Modal.Content>

						<Modal.Actions>
						{
							croppedImage && 
							<Button 
								color="green" 
								onClick = { this.uploadCroppedImage }
								loading = { imageLoading }
								inverted
							>
								<Icon name="save" /> Change Avatar
							</Button>
						}
							<Button color="green" inverted onClick = { this.handleCropImage }>
								<Icon name="image" /> Preview
							</Button>
							<Button color="red" inverted onClick = { this.closeModal }>
								<Icon name="remove" /> Cancel
							</Button>
						</Modal.Actions>

					</Modal>

				</Grid.Column>
			</Grid>
		);
	}
}

export default UserPanel;