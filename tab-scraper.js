const request = require('request');
const qs = require('querystring');
const h2p = require('html2plaintext')
const puppeteer = require('puppeteer')

const baseSearchURL = "https://www.ultimate-guitar.com/search.php?"

getResultsPageFromQuery("Madonna", "Into the Groove", "chords")

//cuts out any text following an open parentheses or dash
function shortenTrackName(trackName, charactersToCut = ["(", "-"]) {

    let trackNameShortened = trackName
    for (let i = 0; i < charactersToCut.length; i++) {
        if (trackNameShortened.indexOf(charactersToCut[i]) != -1) {
            trackNameShortened = trackNameShortened.substring(0, trackNameShortened.indexOf(charactersToCut[i]))
        }
    }
    return trackNameShortened.toLowerCase()
}

//returns an array of URLs containing the results from the results page
//@param: query parameters, type is either "Chords" or "Tab"
//query parameters include
//title will have song name and artist
//type will be 200 for tabs, 300 for chords
async function getResultsPageFromQuery(artistSearchQuery, trackNameSearchQuery, type) {
    let typeCode = 0;
    switch (type.toLowerCase()) {
        case "tab": 
            typeCode = 200
            break;
        case "chords":
            typeCode = 300
            break;
        default: 
            return null;
    }

    let url = baseSearchURL + "title=" + qs.escape(trackNameSearchQuery) + "&type=" + typeCode;
    console.log(url)
    let browser
    try {
        if (browser && browser.process() != null) browser.process().kill('SIGINT');
    browser = await puppeteer.launch({ headless: true})
    console.log("puppeteer launched")
    const page = await browser.newPage()
    console.log("Page opened")
    await page.goto(url)
    console.log("Visited URL:" + url)
    await page.waitForSelector('a')
    //waits for a tags to be rendered, then gets all of their href attributes
    const urls = await page.$$eval('a', anchors => {
        return anchors.map(anchor => 
            { 
                return anchor.getAttribute("href") 
            }
        )
    })

    const baseSearchResultsUrl = "https://tabs.ultimate-guitar.com/tab/"

    //gets only tabs that come from the tabs list, then further filters the list for only the ones in the sought artist
    //also replaces spaces with dashes to work in the URL of the tab
    urlsFilteredTabs = urls.filter((x) => {return x.indexOf(baseSearchResultsUrl) > -1})
    urlsFilteredArtist = urlsFilteredTabs.filter((x) => {return x.indexOf(shortenTrackName(artistSearchQuery).replace(/ /g, "-")) > -1})
    if (urlsFilteredArtist == undefined) return false;

    //go to the printable page
    console.log("Going to tab page: " + urlsFilteredArtist[0])
    await page.goto(urlsFilteredArtist[0])
    console.log("Awaiting anchor element with the correct link...")
    await page.waitForSelector('a[href*="/tab/print?flats"')
    await page.screenshot({path: 'testscreenshot.png'}) //put in to diagnose "undefined" error for browser.pages()
    //click button to download pdf (find button first)
    const printURL = await page.$('a[href*="/tab/print?flats"')
    await page.waitForTimeout(1000) //waits a second as it seems Print button doesn't load in immediately

    await printURL.click({
        delay: 500
    })
    console.log("printURL has been clicked")
    const newPagePromise = new Promise(res => browser.on('targetcreated', res))

    console.log("About to resolve promise...")
    await newPagePromise
    console.log("Promise resolved, now getting popup")
    const pages = await browser.pages()
    console.log("This should be 2: " + pages.length)
    popup = pages[pages.length-1]
    await popup.setViewport({
        width: 1000,
        height: 1000
    })
    console.log("Now waiting for the DIV with that class to appear")
    await popup.waitForSelector("div.page-container")
    console.log("Selector is there, about to iterate")

    const tabContainers = await popup.$$('div.page-container')
    await captureScreenshotsOfElements(tabContainers, popup)
    }
    catch (e) {
        console.log(e)
    }
    finally {
        console.log("Browser closing...")
        await browser?.close()   
    }
}

const captureScreenshotsOfElements = async (elements) => {
    let i = 0;
    for (const element of elements) {
      await element.screenshot({ path: `tmp/${i}.png` });
      i += 1;
    }
  };

