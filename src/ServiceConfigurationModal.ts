import {Modal, Setting} from "obsidian";
import TTSPlugin from "./main";

export class ServiceConfigurationModal extends Modal {
	plugin: TTSPlugin;

	constructor(plugin: TTSPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	display(service?: string): void {

		const { contentEl } = this;

		contentEl.empty();

		new Setting(contentEl)
			.setName('Service')
			.setDesc('test')
			.addDropdown((dropdown) => {
				dropdown.addOption('openai', 'OpenAI');
				dropdown.addOption('microsoft', 'Microsoft Azure');
				dropdown.addOption('kokoro', 'Kokoro');

				dropdown.setValue(service);

				dropdown.onChange(async(value) => {
					this.display(value);
				})
			});

		if (service === 'openai') {
			new Setting(contentEl)
				.setName('API Key')
				.setDesc('API key for OpenAI')
				.addText(async text => {
					text
						.setValue(this.plugin.settings.services.openai.key)
						.onChange(async value => {
							this.plugin.settings.services.openai.key = value;
							await this.plugin.saveSettings();
					});
				})
			;


		}
		if (service === 'kokoro') {
			new Setting(contentEl)
				.setName('Model Type')
				.setDesc('Numerical Type')
				.addDropdown((dropdown) => {
				dropdown.addOption('fp16', 'FP16');
				dropdown.addOption('fp32', 'FP32');
				dropdown.addOption('q8', 'Q8');

				dropdown.setValue(this.plugin.settings.services.kokoro.quant);

				dropdown.onChange(async(value) => {
					this.plugin.settings.services.kokoro.quant = value;
					await this.plugin.saveSettings();
					this.display(value);
				})
			});
			;


		}
	}

	onOpen(): void {
		//@ts-ignore
		this.setTitle('Add new service');
		this.display();

	}


}
