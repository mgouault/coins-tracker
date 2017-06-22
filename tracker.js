let axios = require('axios')
let _ = require('lodash')
let providersConfig = require('./providers.json')
let wallet = require('./wallet.json')

const formatFloat = nb =>
  parseFloat(parseFloat(nb).toFixed(8))
const getTotalBTC = currencies =>
  formatFloat(_.reduce(currencies, (acc, currency) => acc + currency.value, 0))
const getProfitBTC = currencies =>
  formatFloat(_.reduce(currencies, (acc, currency) => acc + currency.profit, 0))
const getProfitPercentageBTC = currencies =>
  Math.round(_.reduce(currencies, (acc, currency) => acc + currency.profitPercentage, 0))

Promise.resolve()
  .then(fetchRates.bind(null, providersConfig))
  .then(buildValue.bind(null, providersConfig, wallet))
  .then(result => ({
    currencies: result,
    totalBTC: getTotalBTC(result),
    profitBTC: getProfitBTC(result),
    profitPercentageBTC: getProfitPercentageBTC(result)
  }))
  .then(result => JSON.stringify(result, null, 2))
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
    currency.profitPercentage = formatFloat((currency.profit / currency.investment) * 100)

    return currency
  })
}