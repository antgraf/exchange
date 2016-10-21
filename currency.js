var EXCHANGE_DOLLAR = '$';
var EXCHANGE_RUBLE = 'R';
var EXCHANGE_EURO = 'E';
var EXCHANGE_LANGUAGES = {
  English: 'eng',
  Russian: 'rus'
};

// SETTINGS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
var EXCHANGE_SETTINGS = {
  language: EXCHANGE_LANGUAGES.Russian,
  primary: EXCHANGE_RUBLE,
  secondary: [EXCHANGE_DOLLAR, EXCHANGE_EURO],
  all: [EXCHANGE_DOLLAR, EXCHANGE_EURO, EXCHANGE_RUBLE]
};

// =====================================================================

if (!String.prototype.format2) {
  String.prototype.format2 = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) {
      return typeof args[number] != 'undefined' ? args[number] : match;
    });
  };
}

// =====================================================================

/* money.js 0.2, MIT license, http://openexchangerates.github.io/money.js */
(function(g, j) {
  var b = function(a) {
    return new i(a)
  };
  b.version = "0.1.3";
  var c = g.fxSetup || {
    rates: {},
    base: ""
  };
  b.rates = c.rates;
  b.base = c.base;
  b.settings = {
    from: c.from || b.base,
    to: c.to || b.base
  };
  var h = b.convert = function(a, e) {
      if ("object" === typeof a && a.length) {
        for (var d = 0; d < a.length; d++) a[d] = h(a[d], e);
        return a
      }
      e = e || {};
      if (!e.from) e.from = b.settings.from;
      if (!e.to) e.to = b.settings.to;
      var d = e.to,
        c = e.from,
        f = b.rates;
      f[b.base] = 1;
      if (!f[d] || !f[c]) throw "fx error";
      d = c === b.base ? f[d] : d === b.base ? 1 / f[c] : f[d] * (1 / f[c]);
      return a * d
    },
    i = function(a) {
      "string" === typeof a ? (this._v = parseFloat(a.replace(/[^0-9-.]/g, "")), this._fx = a.replace(/([^A-Za-z])/g, "")) : this._v = a
    },
    c = b.prototype = i.prototype;
  c.convert = function() {
    var a = Array.prototype.slice.call(arguments);
    a.unshift(this._v);
    return h.apply(b, a)
  };
  c.from = function(a) {
    a = b(h(this._v, {
      from: a,
      to: b.base
    }));
    a._fx = b.base;
    return a
  };
  c.to = function(a) {
    return h(this._v, {
      from: this._fx ? this._fx : b.settings.from,
      to: a
    })
  };
  if ("undefined" !== typeof exports) {
    if ("undefined" !== typeof module && module.exports) exports = module.exports = b;
    exports.fx = fx
  } else "function" === typeof define && define.amd ? define([], function() {
    return b
  }) : (b.noConflict = function(a) {
    return function() {
      g.fx = a;
      b.noConflict = j;
      return b
    }
  }(g.fx), g.fx = b)
})(this);

// =====================================================================

var EXCHANGE_CLASS_SELECTOR = '.exchange';
var EXCHANGE_SECONDARY_CURRENCIES_FORMAT = ' ({0})';
var EXCHANGE_SECONDARY_CURRENCIES_DELIMITER = ' / ';
var EXCHANGE_DATA = {};
EXCHANGE_DATA[EXCHANGE_LANGUAGES.English] = {};
EXCHANGE_DATA[EXCHANGE_LANGUAGES.Russian] = {};
EXCHANGE_DATA[EXCHANGE_LANGUAGES.English][EXCHANGE_DOLLAR] = {
  code: 'USD',
  regex: /(?:\$\s*([\d\.\,]+))|(?:([\d\.\,]+)\s*dol)/i,
  format: '${0}'
}
EXCHANGE_DATA[EXCHANGE_LANGUAGES.English][EXCHANGE_EURO] = {
  code: 'EUR',
  regex: /(?:\€\s*([\d\.\,]+))|(?:([\d\.\,]+)\s*eur)/i,
  format: '€{0}'
}
EXCHANGE_DATA[EXCHANGE_LANGUAGES.English][EXCHANGE_RUBLE] = {
  code: 'RUB',
  regex: /([\d\.\,]+)\s*rub/i,
  format: '{0} RUB'
}
EXCHANGE_DATA[EXCHANGE_LANGUAGES.Russian][EXCHANGE_DOLLAR] = {
  code: 'USD',
  regex: /(?:\$\s*([\d\.\,]+))|(?:([\d\.\,]+)\s*?дол)/i,
  format: '${0}'
}
EXCHANGE_DATA[EXCHANGE_LANGUAGES.Russian][EXCHANGE_EURO] = {
  code: 'EUR',
  regex: /(?:\€\s*([\d\.\,]+))|(?:([\d\.\,]+)\s*?евр)/i,
  format: '€{0}'
}
EXCHANGE_DATA[EXCHANGE_LANGUAGES.Russian][EXCHANGE_RUBLE] = {
  code: 'RUB',
  regex: /([\d\.\,]+)\s*?р/i,
  format: '{0} руб'
}

var load_rates = function(data) {
  fx.bse = data.base;
  fx.rates = data.rates;
  fx.rates[data.base] = 1;
  startup();
}

$.getJSON("https://api.fixer.io/latest", load_rates);

// TODO: class
var startup = function() {
  $(EXCHANGE_CLASS_SELECTOR).each(function(index) {
    $(this).text(render_exchange($(this).text()))
  });
}

function render_exchange(text) {
  var render = text;
  try {
    var parse = parse_currency(text);
    if (parse !== null) {
      var primary = convert_currency(parse.value, parse.currency, EXCHANGE_SETTINGS.primary);
      var render = render_value(primary, EXCHANGE_SETTINGS.primary);

      if (EXCHANGE_SETTINGS.secondary) {
        var secondary = '';
        EXCHANGE_SETTINGS.secondary.forEach(function(curr, i) { // Displaying currencies
          if (i > 0) {
            secondary += EXCHANGE_SECONDARY_CURRENCIES_DELIMITER;
          }
          var convert = convert_currency(parse.value, parse.currency, curr);
          secondary += render_value(convert, curr);
        });
        if (secondary) {
          render += EXCHANGE_SECONDARY_CURRENCIES_FORMAT.format2(secondary);
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
  return render;
}

function render_value(value, currency) {
  return EXCHANGE_DATA[EXCHANGE_SETTINGS.language][currency].format.format2(value);
}

function parse_currency(text) {
  var result = null;
  for (var i = 0; i < EXCHANGE_SETTINGS.all.length; i++) { // All known currencies
    var value = parse_currency_exact(text, EXCHANGE_SETTINGS.all[i]);
    if (value !== null) {
      result = {
        value: value,
        currency: EXCHANGE_SETTINGS.all[i]
      };
      break;
    }
  }
  return result;
}

function parse_currency_exact(text, currency) {
  var result = null;
  var match = EXCHANGE_DATA[EXCHANGE_SETTINGS.language][currency].regex.exec(text);
  if (match !== null) {
    for (var i = 1; i < match.length; i++) {
      if (match[i] !== undefined) {
        result = parseFloat(match[i]).toFixed(2);
        break;
      }
    }
  }
  return result;
}

function convert_currency(value, from, to) {
  return fx.convert(value, {
    from: EXCHANGE_DATA[EXCHANGE_SETTINGS.language][from].code,
    to: EXCHANGE_DATA[EXCHANGE_SETTINGS.language][to].code
  }).toFixed(2);
}
