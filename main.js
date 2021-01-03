let channels = {};

const authenticate = () => {
	return gapi.auth2.getAuthInstance().signIn({scope: "https://www.googleapis.com/auth/youtube.readonly"}).then(() => {
		console.log("Sign-in successful");
	}, (err) => {
		alert("Sign in failed");
		console.error("Error signing in", err);
	});
}

const loadClient = () => {
	gapi.client.setApiKey(apiKey);
	return gapi.client.load("https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest")
		.then(function() { console.log("GAPI client loaded for API"); },
				function(err) { console.error("Error loading GAPI client for API", err); });
}

const fetchVideos = async (playlistId, nextPageToken) => {
	const response = await gapi.client.youtube.playlistItems.list({
		part: ["snippet,contentDetails"],
		playlistId: playlistId,
		maxResults: 1000,
		pageToken: nextPageToken
	});
	response.result.items.forEach(async element => {
		const innerResponse = await gapi.client.youtube.videos.list({
			part: [
				"snippet,contentDetails,statistics"
			],
			id: [
				element.contentDetails.videoId
		]});
		const channelSnippet = innerResponse.result.items[0].snippet;
		if (channelSnippet.channelId in channels) {
			channels[channelSnippet.channelId].count += 1;
		} else {
			channels[channelSnippet.channelId] = {
				name: channelSnippet.channelTitle,
				count: 1
			};
		}
	});
	return response.result.nextPageToken;
}

const execute = async () => {
	channels = {};
	let channelList = document.getElementById('channelList');
	let nextPageToken = await fetchVideos(playlistId);
	while (nextPageToken) {
		nextPageToken = await fetchVideos(playlistId, nextPageToken);
	}
	console.log(channels);
	for (let i = 0; i < Object.keys(channels).length; i++) {
		let largestVal = 0, largestId;
		for (channelId in channels) {
			if (channels[channelId].count > largestVal) {
				largestVal = channels[channelId].count;
				largestId = channelId;
			}
		}
		channels[largestId].count = 0;
		let el = document.createElement('li');
		el.innerHTML = '<a href="https://www.youtube.com/channel/' + largestId + '">' + channels[largestId].name + '</a>: ' + largestVal + ' videos';
		channelList.appendChild(el);
	}
}

gapi.load("client:auth2", function() {
	gapi.auth2.init({client_id: clientId});
});