#!/usr/bin/env node

import cryptocurrencies from 'cryptocurrencies'
import program from 'commander'
import axios from 'axios'
import ora from 'ora'
import Table from 'cli-table2'
import chalk from 'chalk'

const defaultRequestUrl = 'https://api.coinmarketcap.com/v1/ticker/'
const defaultCurrencySymbol = 'USD'
const availableCurrencySymbols = [
  'AUD',
  'BRL',
  'CAD',
  'CHF',
  'CLP',
  'CNY',
  'CZK',
  'DKK',
  'EUR',
  'GBP',
  'HKD',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'JPY',
  'KRW',
  'MXN',
  'MYR',
  'NOK',
  'NZD',
  'PHP',
  'PKR',
  'PLN',
  'RUB',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'TWD',
  'ZAR',
  'USD',
]
const combinedAvailableCurrencies = availableCurrencySymbols.concat(cryptocurrencies.symbols())
const changeColor = (changeString) => {
  const changeFloat = parseFloat(changeString)
  const changeStringFull = `${changeFloat.toFixed(2)} %`
  if (changeFloat > 0) {
    return chalk.green(changeStringFull)
  }
  return chalk.red(changeStringFull)
}

const oraInstance = ora({
  text: 'Loading...'
})

// Coin Price Converter
program
  .command('convert <unit> <symbol> [currency_symbol]')
  .alias('c')
  .description('Convert cryptocurrency to other cryptocurrency or local currency')
  .action((unit, symbol, currency_symbol = defaultCurrencySymbol) => {
    const symbolCaps = symbol.toUpperCase()
    const currencySymbolCaps = currency_symbol.toUpperCase()
    const symbolId = cryptocurrencies[symbolCaps]
    const unitInt = parseFloat(unit)
    if (!combinedAvailableCurrencies.includes(currencySymbolCaps)) {
      return console.error(`${currencySymbolCaps} is currently not supported.`)
    }
    if (symbolId) {
      oraInstance.start()
      axios.get(`${defaultRequestUrl}${symbolId.toLowerCase()}/?convert=${currencySymbolCaps}`)
      .then(({ data }) => {
        oraInstance.stop()
        const priceKey = `price_${currencySymbolCaps.toLowerCase()}`
        const priceInLocalCurrency = data[0][priceKey]
        const value = availableCurrencySymbols.includes(symbol.toUpperCase())
        console.log(`${chalk.blue(`${unit} ${symbol}`)} = ${chalk.green(`${priceInLocalCurrency * unitInt} ${currencySymbolCaps}`)}`);
      })
    }
  })

// Coin info
program
  .command('price <symbol> [currency_symbol]')
  .alias('p')
  .description('Price of a cryptocurrency in other cryptocurrency or local currency')
  .action((symbol, currency_symbol = defaultCurrencySymbol) => {
    const symbolCaps = symbol.toUpperCase()
    const currencySymbolCaps = currency_symbol.toUpperCase()
    const symbolId = cryptocurrencies[symbolCaps]
    if (!combinedAvailableCurrencies.includes(currencySymbolCaps)) {
      return console.error(`${currencySymbolCaps} is currently not supported.`)
    }
    if (symbolId) {
      oraInstance.start()
      axios.get(`${defaultRequestUrl}${symbolId.toLowerCase()}/?convert=${currencySymbolCaps}`)
      .then(({ data }) => {
        oraInstance.stop()
        const priceKey = `price_${currencySymbolCaps.toLowerCase()}`
        const priceInLocalCurrency = data[0][priceKey]
        const percentageChange = data[0].percent_change_24h
        console.log(`${chalk.blue(`1 ${symbol}`)} = ${chalk.green(`${priceInLocalCurrency} ${currencySymbolCaps}`)} (${changeColor(percentageChange)})`);
      })
    }
  })

// Market info
program
  .command('market [currency_symbol]')
  .option('-l, --limit <n>', 'Limit the number of results', parseInt)
  .alias('m')
  .description('Cryptocurrency market details')
  .action((currency_symbol = defaultCurrencySymbol, cmd) => {
    const limit = cmd.limit || 10
    const currencySymbolCaps = currency_symbol.toUpperCase()
    const currencySymbolLowerCase = currency_symbol.toLowerCase()
    if (!combinedAvailableCurrencies.includes(currencySymbolCaps)) {
      return console.error(`${currencySymbolCaps} is currently not supported.`)
    }
    oraInstance.start()
    axios.get(`${defaultRequestUrl}?convert=${currencySymbolCaps}&limit=${limit}`)
    .then(({ data }) => {
      oraInstance.stop()
      const priceKey = `price_${currencySymbolLowerCase}`
      const marketCapKey = `market_cap_${currencySymbolLowerCase}`
      const table = new Table({
        style: {
          head: [],
        },
      })
      table.push([
        chalk.blue('Rank'),
        chalk.blue('Symbol'),
        chalk.blue('Name'),
        chalk.blue(`Price (${currencySymbolCaps})`),
        chalk.blue('Change 1h'),
        chalk.blue('Change 24h'),
        chalk.blue('Change 1w'),
      ])
      data.forEach((o) => {
        table.push([
          o.rank,
          o.symbol,
          o.name,
          `${o[priceKey]} ${currencySymbolCaps}`,
          changeColor(o.percent_change_1h),
          changeColor(o.percent_change_24h),
          changeColor(o.percent_change_7d),
        ])
      })
      console.log(table.toString());
    })
  })

// General
program
  .version('0.0.1')
  .description('Cryptocurrency converter and market info')

  program.on('--help', () => {
    console.log('');
    console.log('  Examples:');
    console.log('');
    console.log('    $ crypto-info convert 30 XRP ETH');
    console.log('    $ crypto-info c 640 XLM INR');
    console.log('    $ crypto-info price ETH');
    console.log('    $ crypto-info p ETH EUR');
    console.log('    $ crypto-info market INR');
    console.log('    $ crypto-info m INR --limit 25');
    console.log('');
  });

program.parse(process.argv)
