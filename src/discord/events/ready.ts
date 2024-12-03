import type SuggestionsBot from '../suggestionsBot';

export default class {
    client: SuggestionsBot;

    constructor(client: SuggestionsBot) {
        this.client = client;
    }

    run() {
        console.info(`Successfully logged in! \nSession Details: id=${this.client.user?.id} tag=${this.client.user?.tag}`);
    }
}
