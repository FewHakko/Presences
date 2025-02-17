const presence = new Presence({
	clientId: "777530802887983124"
});

presence.on("UpdateData", async () => {
	const presenceData: PresenceData = {
			largeImageKey: "google_podcast_logo"
		},
		podcastTitle =
			document.getElementsByClassName("Ut8Gr").length > 0 &&
			document.getElementsByClassName("Ut8Gr")[1].textContent;

	if (podcastTitle) {
		presenceData.details = (
			document.querySelector(".GmW3rb > .BhVIWc") as HTMLImageElement
		).alt;
		presenceData.state = podcastTitle;

		const isPaused =
			(document.querySelector(".DPvwYc.ERYGad") as HTMLSpanElement).style
				.display !== "none";
		presenceData.smallImageKey = isPaused ? "pause" : "play";
		if (!isPaused) {
			presenceData.smallImageKey = "play";
			const ts = Math.round(new Date().getTime() / 1000),
				elapsedSeconds = parseLength(
					document.querySelector(".oG0wpe").children[0].textContent
				);
			presenceData.startTimestamp = ts - elapsedSeconds;
			presenceData.endTimestamp =
				ts +
				parseLength(document.querySelector(".oG0wpe").children[1].textContent) -
				elapsedSeconds;
		}
	} else if (document.location.pathname === "/")
		presenceData.details = "Browsing podcasts";
	else if (document.location.pathname.includes("feed/")) {
		presenceData.details = "Viewing podcast";
		// It's quite tricky to locate the right podcast title because
		// website makes new element for each of them
		for (const element of document.getElementsByClassName("dbCu3e")) {
			if (element.children[0].textContent === document.title)
				presenceData.state = `${document.title} by ${element.children[1].textContent}`;
		}
	} else if (document.location.pathname.includes("/subscriptions"))
		presenceData.details = "Browsing subscriptions";
	else if (document.location.pathname.includes("/queue"))
		presenceData.details = "Browsing queue";
	else if (document.location.pathname.includes("/subscribe-by-rss-feed"))
		presenceData.details = "Subscribing by RSS feed";
	else if (document.location.pathname.includes("/settings"))
		presenceData.details = "Browsing settings";
	else if (document.location.pathname.includes("search/")) {
		presenceData.details = "Searching for podcast";
		presenceData.state = document.location.pathname.replace("/search/", "");
	}

	if (presenceData.details) presence.setActivity(presenceData);
	else presence.setActivity();
});

// Function that convert lengths like 01:13 to seconds like 73
function parseLength(length: string) {
	const elements = length.split(":").reverse();
	let result = 0;
	for (let i = 0; i < elements.length; i++) {
		const element = elements[i];
		if (!isNaN(Number(element))) result += Number(element) * Math.pow(60, i);
	}
	return result;
}
