import {TTSService} from "./TTSService";
import TTSPlugin from "../main";
import {requestUrl} from "obsidian";
import { KokoroTTS } from "kokoro-js";

const model_id = "onnx-community/Kokoro-82M-ONNX";


export class Kokoro implements TTSService {
	plugin: TTSPlugin;
	id = "kokoro";
	name = "Kokoro";
	
	source: AudioBufferSourceNode;
	currentTime = 0;
	constructor(plugin: TTSPlugin) {
		this.plugin = plugin;
		this.tts = await KokoroTTS.from_pretrained(model_id, {
			dtype: this.plugin.settings.services.kokoro.quant, // Options: "fp32", "fp16", "q8", "q4", "q4f16"
		});
	}

	languages: ["en"];

	async getVoices(): Promise<{ id: string; name: string; languages: string[] }[]> {
		voices = [];
		for (const voice of tts.list_voices()) {
			voices.push({
				id: voice,
				name: voice,
				languages: this.languages,
			});
		}
		return voices;
	}

	isConfigured(): boolean {
		if(!this.tts)  return false;
		return true;
	}

	isPaused(): boolean {
		if(!this.source) return true;
		return this.source.context.state === "suspended";
	}

	isSpeaking(): boolean {
		if(!this.source) return false;
		return this.source.context.state === "running";
	}

	isValid(): boolean {
		if(!this.tts)  return false;
		return true;
	}

	pause(): void {
		this.currentTime = this.source.context.currentTime;
		this.source.stop();
	}

	resume(): void {
		this.source.start(this.currentTime);
	}

	async sayWithVoice(text: string, voice: string) : Promise<void> {
  
		const audioFile =  await tts.generate(text, {
      voice: voice,
    });


		const context = new AudioContext();
		const buffer = await context.decodeAudioData(audioFile.arrayBuffer);
		this.source = context.createBufferSource();
		this.source.buffer = buffer;
		this.source.connect(context.destination);
		this.source.start();
	}

	stop(): void {
		this.source.stop();
	}

}
