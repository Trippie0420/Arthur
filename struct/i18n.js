const fs = require('fs');
const sql = require('sqlite');
const path = require('path');
const { Collection } = require('discord.js');

const localeDirectory = path.join(__dirname, '..', 'locales');

class i18n {
	constructor () {
		this._locales = new Collection();
		this._localeNames = new Collection();
		this._localeNamesReversed = new Collection();
		this._guildLocaleCache = new Collection();
		this._userLocaleCache = new Collection();
		
		let files = fs.readdirSync(localeDirectory);
		if (!files) throw new Error('No locales found.');
		
		files.filter(file => file.endsWith('.json'));
		if (!files || files.length === 0) throw new Error('No locales found.'); 
		
		files.forEach(file => {
			let filename = file.slice(0, -5);
			let args = filename.split(' ');
			
			this._locales.set(args[0], require(path.join(localeDirectory, file)));
			this._localeNamesReversed.set(args.slice(1).join(' '), args[0]);
			this._localeNames.set(args.shift(), args.join(' '));
		})
	}
	
	getLocales () {
		return this._localeNames.keyArray();
	}
	
	getLocaleNames () {
		return Array.from(this._localeNames.values());
	}
	
	_handleLocaleResult (result) {
		if (!result) return 'English (United States) | en-US';
		else return this._localeNames.get(result.locale) + ' | ' + result.locale;
	}
	
	async getGuildLocale (id) {
		let result = await sql.get('SELECT locale FROM guildOptions WHERE guildID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setGuildLocale (id, locale) {
		await sql.run(`INSERT OR IGNORE INTO guildOptions (guildID, locale) VALUES ('${id}', '${locale}'); UPDATE guildOptions SET locale = '${locale}' WHERE guildID = '${id}';`);
		this._guildLocaleCache.set(id, locale);
	}
	
	async getUserLocale (id) {
		let result = await sql.get('SELECT locale FROM userOptions WHERE userID = ?', [ id ]);
		return this._handleLocaleResult(result);
	}
	
	async setUserLocale (id, locale) {
		await sql.run(`INSERT OR IGNORE INTO userOptions (userID, locale) VALUES ('${id}', '${locale}'); UPDATE userOptions SET locale = '${locale}' WHERE userID = '${id}'`);
		this._userLocaleCache.set(id, locale);
	}
}

module.exports = i18n;