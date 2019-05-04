const cheerio = require('cheerio');
const URI = require('urijs');
const request = require('request-promise');

if (process.argv.length < 4) {
    usage()
}

(async () => {
    const from = process.argv[2], to = process.argv[3]
    const url = URI('https://reiseauskunft.bahn.de/bin/query.exe/dn')
        .query({
            'S': from,
            'Z': to,
            'start': '1'
        }).toString()

    const $ = await request(url, {
        transform: body => cheerio.load(body)
    })

    let firstrows = []
    $('.result .firstrow').each((i, el) => {
        parse = attr => parseQuery($, el, attr)

        firstrows.push({
            station: {
                departure: parse('td.station.first')
            }, 
            time: {
                departure: parse('td.time').substr(0,5)
            },
            live: {
                departure: parse('span.delayOnTime').substr(0,5)
            },
            duration: parse('td.duration'),
            changes: parse('td.changes'),
            products: parse('td.products'),
        })
    })

    $('.result .last').each((i, el) => {
        parse = attr => parseQuery($, el, attr)

        firstrows[i].station.destination = parse('td.station.stationDest')
        firstrows[i].time.arrival = parse('td.time').substr(0,5)
        firstrows[i].live.arrival = parse('span.delayOnTime').substr(0,5)
    })

    $('.result .buttonLine').each((i, el) => {
        firstrows[i].details = $('.open',el).attr('href')
        firstrows[i].book = $('.buttonbold',el).attr('href')
    })

    console.log(firstrows)

})()

function parseQuery($, el, attr) {
    return $(attr, el).text().replace(/\n/g, '').trim()
}

function usage() {
    console.log(`usage: ${process.argv[1]} [from] [to]`)
    process.exit(2)
}