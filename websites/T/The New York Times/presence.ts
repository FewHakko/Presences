const presence = new Presence({
		clientId: "813781191308083239"
	}),
	time = Math.floor(Date.now() / 1000);

presence.on("UpdateData", async () => {
	const title = document.title.replace(" - The New York Times", ""),
		setting = await getSettings(),
		{ pathname } = window.location,
		path = pathname.split("/"),
		presenceData: PresenceData = {
			largeImageKey: "logo",
			startTimestamp: time
		};

	if (window.location.hostname === "www.nytimes.com") {
		if (setting.buttons && !setting.privacy) {
			presenceData.buttons = [
				{
					label: "View Page",
					url: window.location.href
				}
			];
		}

		if (
			((path[1] === "international" || path[1] === "ca" || path[1] === "es") &&
				!path[2]) ||
			!path[1]
		)
			presenceData.details = "Viewing Home Page";
		else if (pathname.includes("/interactive/")) {
			presenceData.details = "Viewing an Interactive:";
			if (!setting.privacy) presenceData.state = title;
		} else if (
			pathname.includes("/section/") ||
			pathname.includes("/spotlight/podcasts")
		) {
			presenceData.details = "Viewing a Section Page:";
			if (!setting.privacy) presenceData.state = title;
		} else if (pathname.includes("/destination/")) {
			presenceData.details = "Viewing a Destination Page:";
			if (!setting.privacy) presenceData.state = title;
		} else if (pathname.includes("/reviews/")) {
			presenceData.details = "Viewing a Review Page:";
			if (!setting.privacy) presenceData.state = title;
		} else if (pathname.includes("/column/")) {
			presenceData.details = "Viewing a Column Page:";
			if (!setting.privacy) presenceData.state = title;
		} else if (pathname.includes("/search")) {
			presenceData.details = setting.privacy ? "Searching" : "Searching for:";
			if (!setting.privacy) {
				presenceData.state = new URLSearchParams(window.location.search).get(
					"query"
				);
			}

			if (setting.buttons && !setting.privacy) {
				presenceData.buttons = [
					{
						label: "Show Search Results",
						url: window.location.href
					}
				];
			}
		} else if (pathname.includes("/video/")) {
			presenceData.details = "Viewing a Video Section:";
			presenceData.state = title;
		} else if (hasDatePath(pathname) && pathname.includes("/podcasts/")) {
			const audioPlayer = document.querySelector("audio"),
				podcast = document.querySelector("span.css-1f76qa2 span"),
				podcastLogo = document.querySelector<HTMLImageElement>(
					"span.css-1f76qa2 img"
				);

			presenceData.details = setting.privacy
				? "Listening to a Podcast"
				: "Listening to a Podcast:";
			if (podcast && !setting.privacy)
				presenceData.state = `${podcast.textContent}: ${title}`;

			if (audioPlayer && !isNaN(audioPlayer.duration)) {
				const timestamps = presence.getTimestampsfromMedia(audioPlayer);

				presenceData.startTimestamp = timestamps[0];
				presenceData.endTimestamp = timestamps[1];

				if (audioPlayer.paused) {
					delete presenceData.endTimestamp;
					presenceData.startTimestamp = time;
				}
			}

			if (setting.buttons && !setting.privacy) {
				presenceData.buttons = [
					{
						label: "Listen to Podcast",
						url: window.location.href
					}
				];
			}

			if (setting.podcastLogo && !setting.privacy && podcastLogo)
				presenceData.largeImageKey = await getShortURL(podcastLogo.src);
		} else if (path[1] === "by" && path[2]) {
			const author =
				document.querySelector("h1.css-1uxfi68.e16wpn5v0")?.textContent ??
				"Unknown";

			presenceData.details = "Viewing an Author Page:";
			presenceData.state = author;

			if (document.querySelector("div.css-cnx41t img")) {
				presenceData.smallImageKey = await getShortURL(
					document.querySelector<HTMLImageElement>("div.css-cnx41t img").src
				);
				presenceData.smallImageText = author;
			}
		} else if (hasDatePath(pathname) && path[4]) {
			const author = document.querySelector<HTMLImageElement>(
					"img.css-1bfqq7u.ey68jwv2"
				),
				authors = document.querySelector("p.css-aknsld.e1jsehar1"),
				headline =
					document.querySelector('h1[data-testid="headline"]')?.textContent ??
					title,
				isLive = document.querySelector(
					'span span.css-bwjyn0.live-blog-header-live-label[data-active="true"]'
				),
				wasLive = document.querySelector("span.css-233int.e16638kd4");

			presenceData.details = setting.privacy
				? "Reading an Article"
				: setting.moreDetails && !isLive && !wasLive
				? headline
				: "Reading an Article:";

			if (!setting.privacy) {
				presenceData.state =
					setting.moreDetails && !isLive && !wasLive
						? `${authors?.textContent ?? `By ${author?.title ?? "Unknown"}`}, ${
								document.querySelector("time span")?.textContent
						  }`
						: headline;
			}

			if (setting.buttons && !setting.privacy) {
				presenceData.buttons = [
					{
						label: "Read Article",
						url: window.location.href
					}
				];
			}

			if (isLive) {
				presenceData.smallImageKey = "live";
				presenceData.smallImageText = "Live";
			} else if (setting.articleAuthor && !setting.privacy && author) {
				presenceData.smallImageKey = await getShortURL(author.src);
				presenceData.smallImageText =
					authors?.textContent ?? `By ${author.title}`;
			}
		}
	} else if (window.location.hostname === "myaccount.nytimes.com") {
		presenceData.details = "Managing Account";

		if (!setting.privacy) {
			if (path[2] === "subscription")
				presenceData.state = "Subscription Overview";
			else if (path[2] === "billing") presenceData.state = "Billing History";
			else if (path[2] === "settings")
				presenceData.state = "Emails and Settings";
			else if (path[2] === "change-email") presenceData.state = "Change Email";
			else if (path[2] === "forgot-password")
				presenceData.state = "Reset Password";
			else if (path[1] === "get-started" && path[2] === "manage-billing")
				presenceData.state = "Payment details";
		}
	}

	if (!presenceData.state) delete presenceData.state;

	if (!presenceData.details) presence.setActivity();
	else presence.setActivity(presenceData);
});

const shortenedURLs: Record<string, string> = {};
async function getShortURL(url: string) {
	if (!url || url.length < 256) return url;
	if (shortenedURLs[url]) return shortenedURLs[url];
	try {
		const pdURL = await (
			await fetch(`https://pd.premid.app/create/${url}`)
		).text();
		shortenedURLs[url] = pdURL;
		return pdURL;
	} catch (err) {
		presence.error(err);
		return url;
	}
}

function hasDatePath(pathname: string) {
	return /[0-9]{4}\/[0-9]{2}\/[0-9]{2}/g.test(pathname);
}

async function getSettings() {
	const settings = await Promise.all([
			presence.getSetting<boolean>("privacy"),
			presence.getSetting<boolean>("buttons"),
			presence.getSetting<boolean>("podcastLogo"),
			presence.getSetting<boolean>("articleAuthor"),
			presence.getSetting<boolean>("moreDetails")
		]),
		names = [
			"privacy",
			"buttons",
			"podcastLogo",
			"articleAuthor",
			"moreDetails"
		],
		obj: {
			[key: string]: boolean;
		} = {};

	names.forEach((name, i) => {
		obj[name] = settings[i];
	});

	return obj;
}
