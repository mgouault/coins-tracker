let axios = require('axios')
let _ = require('lodash')
let providersConfig = require('./providers.json')
let wallet = require('./wallet.json')

const formatFloat = nb =>
  parseFloat(parseFloat(nb).toFixed(8))
const calcValue = currencies =>
  formatFloat(_.reduce(currencies, (acc, currency) => acc + currency.value, 0))
const calcInvestment = currencies =>
  formatFloat(_.reduce(currencies, (acc, currency) => acc + currency.investment, 0))
const calcProfit = (value, investment) =>
  formatFloat(value - investment)
const calcProfitMultiplier = (profit, investment) =>
  parseFloat(parseFloat((profit / investment) + 1).toFixed(2))

Promise.resolve()
  .then(fetchRates.bind(null, providersConfig))
  .then(buildValue.bind(null, providersConfig, wallet))
  .then(currencies => ({
    currencies,
    valueBTC: calcValue(currencies),
    investmentBTC: calcInvestment(currencies)
  }))
  .then(obj => Object.assign(obj, {
    profitBTC: calcProfit(obj.valueBTC, obj.investmentBTC)
  }))
  .then(obj => Object.assign(obj, {
    profitMultiplierBTC: calcProfitMultiplier(obj.profitBTC, obj.investmentBTC)
  }))
  .then(obj => JSON.stringify(obj, null, 2))
  .then(console.log)
  .catch(console.error)

function fetchRates (providers) {
  let
    rates = {},
    promises = []

  providers.forEach(provider => {
    promises.push(
      axios.get(provider.url)
        .then(res => rates[provider.name] = _.get(res, provider.path))
    )
  })

  return Promise.all(promises).then(() => rates)
}

function buildValue (providers, currencies, rates) {
  return currencies.map(currency => {
    let provider = providers.find(provider => provider.name === currency.provider)

    if (!provider)
      throw new Error(`NO PROVIDER: ${currency.provider}`)

    let
      providerParser = provider.parser.replace('$providerSlug$', currency.providerSlug),
      path = `['${provider.name}']${providerParser}`,
      rate = _.get(rates, path)

    rate = formatFloat(rate)
    currency.wallet = formatFloat(currency.wallet)

    currency.investment = formatFloat(currency.investment)
    currency.value = formatFloat(currency.wallet * rate)

    currency.profit = formatFloat(currency.value - currency.investment)
    currency.profitMultiplier = formatFloat((currency.profit / currency.investment) + 1)

    return currency
  })
}