import {MarkdownView, Notice, parseYaml} from "obsidian";
import {LanguageVoiceMap} from "./settings";
import TTSPlugin from "./main";

export class TTSService {
	plugin: TTSPlugin;

	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
	}

	stop(): void {
		if (!this.isSpeaking()) return;
		window.speechSynthesis.cancel();
	}

	pause(): void {
		if (!this.isSpeaking()) return;
		window.speechSynthesis.pause();
	}

	resume(): void {
		if (!this.isSpeaking()) return;
		window.speechSynthesis.resume();
	}

	isSpeaking(): boolean {
		return window.speechSynthesis.speaking;
	}

	isPaused(): boolean {
		return window.speechSynthesis.paused;
	}

	async sayWithVoice(title: string, text: string, voice: string): Promise<void> {
		let content = text;
		if (!this.plugin.settings.speakSyntax) {
			content = content.replace(/#/g, "");
			content = content.replace(/-/g, "");
			content = content.replace(/_/g, "");
			content = content.replace(/\*/g, "");
			content = content.replace(/\^/g, "");
			content = content.replace(/==/g, "");
		}
		if (!this.plugin.settings.speakLinks) {
			//regex from https://stackoverflow.com/a/37462442/5589264
			content = content.replace(/(?:__|[*#])|\[(.*?)]\(.*?\)/gm, '$1');
		}
		if (!this.plugin.settings.speakCodeblocks) {
			content = content.replace(/```[\s\S]*?```/g, '');
		}

		if (this.plugin.settings.speakTitle && title?.length > 0) {
			content = title + " ! ! " + content;
		}

		if (!this.plugin.settings.speakEmoji) {
			//regex from https://ihateregex.io/expr/emoji/
			content = content.replace(/(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g, '');
		}

		//add pauses, taken from https://stackoverflow.com/a/50944593/5589264
		content = content.replace(/\n/g, " ! ");


		//only speak link aliases.
		content = content.replace(/\[\[(.*\|)(.*)]]/gm, '$2');


		const msg = new SpeechSynthesisUtterance();
		msg.text = content;
		msg.volume = this.plugin.settings.volume;
		msg.rate = this.plugin.settings.rate;
		msg.pitch = this.plugin.settings.pitch;
		msg.voice = window.speechSynthesis.getVoices().filter(otherVoice => otherVoice.name === voice)[0];
		window.speechSynthesis.speak(msg);

		this.plugin.statusbar.setText("TTS: speaking");
	}


	getVoice(languageCode: string): string {
		const filtered = this.plugin.settings.languageVoices.filter((lang: LanguageVoiceMap) => lang.language === languageCode);
		if (filtered.length === 0) return null;
		return filtered[0].voice;
	}

	async say(title: string, text: string, languageCode?: string): Promise<void> {
		let usedVoice = this.plugin.settings.defaultVoice;
		if (languageCode && languageCode.length !== 0) {
			const voice = this.getVoice(languageCode);
			if (voice) {
				usedVoice = voice;
			} else {
				new Notice("TTS: could not find voice for language " + languageCode + ". Using default voice.");
			}
		}
		await this.sayWithVoice(title, text, usedVoice);
	}


	async play(view: MarkdownView): Promise<void> {
		let selectedText = view.editor.getSelection().length > 0 ? view.editor.getSelection() : window.getSelection().toString();
		let content = selectedText.length > 0 ? selectedText : view.getViewData();
		let title = selectedText.length > 0 ? null : view.getDisplayText();
		const language = this.getLanguageFromFrontmatter(view);

		if (!this.plugin.settings.speakFrontmatter)
			if (content.startsWith("---")) {
				content = content.replace("---", "");
				content = content.substring(content.indexOf("---") + 1);
			}

		await this.say(title, content, language);

	}

	getLanguageFromFrontmatter(view: MarkdownView): string {
		let language = "";
		//check if any language is defined in frontmatter
		if (!view.getViewData().startsWith("---")) return language;

		const frontmatter = view.getViewData().match(/---[\s\S]*?---/);
		if (frontmatter && frontmatter[0]) {
			const parsedFrontmatter = parseYaml(frontmatter[0].replace(/---/g, ''));
			if (parsedFrontmatter['lang']) {
				language = parsedFrontmatter['lang'];
			}
		}
		return language;
	}

}
