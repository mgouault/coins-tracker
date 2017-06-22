let axios = require('axios')
let _ = require('lodash')
let config = require('./config.json')

const formatFloat = nb =>
  parseFloat(parseFloat(nb).toFixed(8))
const getTotalBTC = currencies =>
  formatFloat(_.reduce(currencies, (acc, currency) => acc + currency.value, 0))
const getProfitsBTC = currencies =>
  formatFloat(_.reduce(currencies, (acc, currency) => acc + currency.profits, 0))

Promise.resolve()
  .then(fetchRates.bind(null, config.providers))
  .then(buildValue.bind(null, config.providers, config.currencies))
  .then(result => ({
    currencies: result,
    totalBTC: getTotalBTC(result),
    profitsBTC: getProfitsBTC(result)
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
    currency.profits = formatFloat(currency.value - currency.investment)

    return currency
  })
}