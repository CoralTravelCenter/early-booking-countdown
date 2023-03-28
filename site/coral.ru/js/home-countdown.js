var slice = [].slice;

window.ASAP || (window.ASAP = (function() {
  var callall, fns;
  fns = [];
  callall = function() {
    var f, results;
    results = [];
    while (f = fns.shift()) {
      results.push(f());
    }
    return results;
  };
  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callall, false);
    window.addEventListener('load', callall, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', callall);
    window.attachEvent('onload', callall);
  }
  return function(fn) {
    fns.push(fn);
    if (document.readyState === 'complete') {
      return callall();
    }
  };
})());

String.prototype.zeroPad = function(len, c) {
  var s;
  s = '';
  c || (c = '0');
  len || (len = 2);
  len -= this.length;
  while (s.length < len) {
    s += c;
  }
  return s + this;
};

Number.prototype.zeroPad = function(len, c) {
  return String(this).zeroPad(len, c);
};

Number.prototype.pluralForm = function(root, suffix_list) {
  return root + (this >= 11 && this <= 14 ? suffix_list[0] : suffix_list[this % 10]);
};

Number.prototype.asDays = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('д', ['ней', 'ень', 'ня', 'ня', 'ня', 'ней', 'ней', 'ней', 'ней', 'ней']);
};

Number.prototype.asHours = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('час', ['ов', '', 'а', 'а', 'а', 'ов', 'ов', 'ов', 'ов', 'ов']);
};

Number.prototype.asMinutes = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('мин', ['', '', '', '', '', '', '', '', '', '']);
};

Number.prototype.asSeconds = function() {
  var d;
  d = Math.floor(this);
  return d.pluralForm('сек', ['', '', '', '', '', '', '', '', '', '']);
};

ASAP(function() {
  return (function($, window) {
    var Flipdown;
    return Flipdown = (function() {
      Flipdown.prototype.defaults = {
        momentX: moment().add({
          d: 2
        }),
        labels: true,
        overMessage: '',
        updateHighestRank: function() {}
      };

      function Flipdown(el, options) {
        this.options = $.extend({}, this.defaults, options);
        this.$el = $(el);
        this.server_moment = moment();
        this.time_gap = moment.duration(0);
        this.init();
      }

      Flipdown.prototype.init = function() {
        $.ajax('/', {
          method: 'HEAD'
        }).then((function(_this) {
          return function(a, b, c) {
            _this.server_moment = moment(c.getResponseHeader('Date'));
            return _this.time_gap = moment.duration(_this.server_moment.diff(moment()));
          };
        })(this));
        return this;
      };

      Flipdown.prototype.tick = function() {
        var remains;
        remains = moment.duration(this.options.momentX.diff(moment())).add(this.time_gap);
        if (remains.asSeconds() <= 0) {
          this.over();
          return this;
        }
        this.render(remains).then((function(_this) {
          return function() {
            return _this.rafh = requestAnimationFrame(function() {
              return _this.tick();
            });
          };
        })(this));
        return this;
      };

      Flipdown.prototype.start = function() {
        this.rafh = requestAnimationFrame((function(_this) {
          return function() {
            return _this.tick();
          };
        })(this));
        return this;
      };

      Flipdown.prototype.stop = function() {
        if (this.rafh) {
          cancelAnimationFrame(this.rafh);
        }
        return this;
      };

      Flipdown.prototype.over = function() {
        var msg_letters, pad;
        this.stop();
        if (this.options.overMessage) {
          msg_letters = this.options.overMessage.split('');
          pad = 8 - msg_letters.length;
          while (pad--) {
            msg_letters.unshift(' ');
          }
          this.render({
            days: function() {
              return (msg_letters[0] || ' ') + (msg_letters[1] || ' ');
            },
            hours: function() {
              return (msg_letters[2] || ' ') + (msg_letters[3] || ' ');
            },
            minutes: function() {
              return (msg_letters[4] || ' ') + (msg_letters[5] || ' ');
            },
            seconds: function() {
              return (msg_letters[6] || ' ') + (msg_letters[7] || ' ');
            }
          }).then((function(_this) {
            return function() {
              return _this.$el.trigger('time-is-up');
            };
          })(this));
          this.$el.find('.label').css({
            visibility: 'hidden'
          });
        } else {
          this.$el.trigger('time-is-up');
        }
        return this;
      };

      Flipdown.prototype.render = function(remains) {
        var hit_non_zero_rank, promise;
        hit_non_zero_rank = false;
        promise = $.Deferred();
        this.$el.find('[data-units]').each((function(_this) {
          return function(idx, el) {
            var $stacks, $units, digits2set, ex, units, value, value2set;
            $units = $(el);
            units = $units.attr('data-units');
            value = Number($units.attr('data-value'));
            value2set = remains[units]();
            try {
              if (value2set !== 0 && !hit_non_zero_rank) {
                _this.options.updateHighestRank({
                  units: units,
                  value: value2set
                });
              }
            } catch (error) {
              ex = error;
            }
            hit_non_zero_rank || (hit_non_zero_rank = value2set !== 0);
            if (!hit_non_zero_rank) {
              $units.addClass('insignificant');
            }
            if (value2set !== value) {
              $units.attr('data-value', value2set);
              digits2set = value2set.zeroPad(2);
              $stacks = $units.find('.flipper-stack');
              $.when(_this.flipStack2($stacks.eq(0), digits2set[0]), _this.flipStack2($stacks.eq(1), digits2set[1])).then(function() {
                return promise.resolve();
              });
              try {
                if (_this.options.labels) {
                  return $units.find('.label').text(value2set[{
                    days: 'asDays',
                    hours: 'asHours',
                    minutes: 'asMinutes',
                    seconds: 'asSeconds'
                  }[units]]());
                }
              } catch (error) {}
            } else {
              return promise.resolve();
            }
          };
        })(this));
        return promise;
      };

      Flipdown.prototype.flipStack2 = function(stack_el, n) {
        var $last_flipper, $new_flipper, $recent_flippers, $stack_el, promise;
        $stack_el = $(stack_el);
        promise = $.Deferred();
        $recent_flippers = $stack_el.children();
        $last_flipper = $recent_flippers.eq(-1);
        if ($last_flipper.attr('data-digit') !== String(n)) {
          $new_flipper = $("<div class='flipper flip-in' data-digit='" + n + "'></div>");
          $stack_el.append($new_flipper);
          $last_flipper.addClass('flip-out');
          setTimeout(function() {
            return $new_flipper.one('transitionend transitioncancel', function() {
              $recent_flippers.remove();
              return promise.resolve();
            }).removeClass('flip-in');
          }, 0);
        } else {
          promise.resolve();
        }
        return promise;
      };

      $.fn.extend({
        Flipdown: function() {
          var args, option;
          option = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
          return this.each(function() {
            var $this, data;
            $this = $(this);
            data = $this.data('Flipdown');
            if (!data) {
              $this.data('Flipdown', (data = new Flipdown(this, option)));
            }
            if (typeof option === 'string') {
              return data[option].apply(data, args);
            }
          });
        }
      });

      return Flipdown;

    })();
  })(window.jQuery, window);
});

ASAP(function() {
  return $('#home-countdown').slideDown(function() {
    return $('.countdown-widget').on('time-is-up', function() {
      return $(this).closest('#home-countdown').slideUp();
    }).Flipdown({
      momentX: moment('2023-03-31T20:59:59Z'),
      updateHighestRank: function(data) {
        $('.highest-rank-count').text(data.value);
        return $('.highest-rank-wording').text(data.value[{
          days: 'asDays',
          hours: 'asHours',
          minutes: 'asMinutes',
          seconds: 'asSeconds'
        }[data.units]]());
      }
    }).Flipdown('start');
  });
});
