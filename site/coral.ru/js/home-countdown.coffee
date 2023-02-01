window.ASAP ||= (->
    fns = []
    callall = () ->
        f() while f = fns.shift()
    if document.addEventListener
        document.addEventListener 'DOMContentLoaded', callall, false
        window.addEventListener 'load', callall, false
    else if document.attachEvent
        document.attachEvent 'onreadystatechange', callall
        window.attachEvent 'onload', callall
    (fn) ->
        fns.push fn
        callall() if document.readyState is 'complete'
)()

String::zeroPad = (len, c) ->
    s = ''
    c ||= '0'
    len ||= 2
    len -= @length
    s += c while s.length < len
    s + @
Number::zeroPad = (len, c) -> String(@).zeroPad len, c

Number::pluralForm = (root, suffix_list) ->
    root + (if this >= 11 && this <= 14 then suffix_list[0] else suffix_list[this % 10]);
Number::asDays = () ->
    d = Math.floor(this)
    d.pluralForm('д', ['ней', 'ень', 'ня', 'ня', 'ня', 'ней', 'ней', 'ней', 'ней', 'ней'])
Number::asHours = () ->
    d = Math.floor(this)
    d.pluralForm('час', ['ов', '', 'а', 'а', 'а', 'ов', 'ов', 'ов', 'ов', 'ов'])
Number::asMinutes = () ->
    d = Math.floor(this)
    d.pluralForm('мин', ['', '', '', '', '', '', '', '', '', ''])
Number::asSeconds = () ->
    d = Math.floor(this)
    d.pluralForm('сек', ['', '', '', '', '', '', '', '', '', ''])

ASAP ->
    do($ = window.jQuery, window) ->
        class Flipdown
            defaults:
                momentX: moment().add({ d: 2 })
                labels: yes
                overMessage: ''

            constructor: (el, options) ->
                @options = $.extend({}, @defaults, options)
                @$el = $(el)
                @server_moment = moment()
                @time_gap = moment.duration(0)
                @init()

            init: () ->
                $.ajax('/', method: 'HEAD').then (a,b,c) =>
                    @server_moment = moment(c.getResponseHeader('Date'))
                    @time_gap = moment.duration(@server_moment.diff(moment()))
                @

            tick: () ->
                remains = moment.duration(@options.momentX.diff(moment())).add(@time_gap)
                if remains.asSeconds() <= 0
                    @over()
                    return @
                @render(remains).then =>
                    @rafh = requestAnimationFrame => @tick()
                @

            start: () ->
                @rafh = requestAnimationFrame => @tick()
                @

            stop: () ->
                cancelAnimationFrame @rafh if @rafh
                @

            over: () ->
                @stop()
                if @options.overMessage
                    msg_letters = @options.overMessage.split ''
                    pad = 8 - msg_letters.length
                    msg_letters.unshift ' ' while pad--
                    @render
                        days: -> (msg_letters[0] or ' ') + (msg_letters[1] or ' ')
                        hours: -> (msg_letters[2] or ' ') + (msg_letters[3] or ' ')
                        minutes: -> (msg_letters[4] or ' ') + (msg_letters[5] or ' ')
                        seconds: -> (msg_letters[6] or ' ') + (msg_letters[7] or ' ')
                    .then => @$el.trigger('time-is-up')
                    @$el.find('.label').css visibility: 'hidden'
                else
                    @$el.trigger('time-is-up')
                @

            render: (remains) ->
                hit_non_zero_rank = false
                promise = $.Deferred()
                @$el.find('[data-units]').each (idx, el) =>
                    $units = $(el)
                    units = $units.attr('data-units')
                    value = Number($units.attr('data-value'))
                    value2set = remains[units]()
                    hit_non_zero_rank ||= value2set != 0
                    $units.addClass 'insignificant' unless hit_non_zero_rank
                    if value2set != value
                        $units.attr 'data-value', value2set
                        digits2set = value2set.zeroPad(2)
                        $stacks = $units.find('.flipper-stack')
                        $.when(@flipStack2($stacks.eq(0), digits2set[0]), @flipStack2($stacks.eq(1), digits2set[1])).then -> promise.resolve()
                        try
                            $units.find('.label').text value2set[{
                                days: 'asDays',
                                hours: 'asHours',
                                minutes: 'asMinutes',
                                seconds: 'asSeconds'
                            }[units]]() if @options.labels
                    else
                        promise.resolve()
                promise

            flipStack2: (stack_el, n) ->
                $stack_el = $(stack_el)
                promise = $.Deferred()
                $recent_flippers = $stack_el.children()
                $last_flipper = $recent_flippers.eq(-1)
                if $last_flipper.attr('data-digit') != String(n)
                    $new_flipper = $ "<div class='flipper flip-in' data-digit='#{ n }'></div>"
                    $stack_el.append $new_flipper
                    $last_flipper.addClass 'flip-out'
                    setTimeout ->
                        $new_flipper.one 'transitionend transitioncancel', ->
                            $recent_flippers.remove()
                            promise.resolve()
                        .removeClass 'flip-in'
                    , 0
                else
                    promise.resolve()
                promise

            # Define the plugin
            $.fn.extend Flipdown: (option, args...) ->
                @each ->
                    $this = $(this)
                    data = $this.data('Flipdown')
                    if !data
                        $this.data 'Flipdown', (data = new Flipdown(this, option))
                    if typeof option == 'string'
                        data[option].apply(data, args)

ASAP ->
    $('#home-countdown').slideDown ->
        window.$countdown = $('.countdown-widget').Flipdown
            momentX: moment('2023-02-04T20:59:59Z')
        $countdown.on 'time-is-up', ->
            $countdown.closest('.widgetcontainer').slideUp()
        .Flipdown('start')
