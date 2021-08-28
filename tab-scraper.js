const qs = require('querystring');
const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')
const baseSearchURL = "https://www.ultimate-guitar.com/search.php?"

takeScreenshotsOfTab("The Cure", "Friday I'm In Love", "chords")


//cuts out any text following an open parentheses or dash, and lowercases it
//this is so the artist name can be fed into the URL for tabs
function shortenTrackName(trackName, charactersToCut = ["(", "-"]) {

    let trackNameShortened = trackName
    for (let i = 0; i < charactersToCut.length; i++) {
        if (trackNameShortened.indexOf(charactersToCut[i]) != -1) {
            trackNameShortened = trackNameShortened.substring(0, trackNameShortened.indexOf(charactersToCut[i]))
        }
    }
    return trackNameShortened.toLowerCase()
}
//gets type code from the type string
//title will have song name and artist
//type will be 200 for tabs, 300 for chords
function getTypeCode(typeString) {
    
    switch (typeString.toLowerCase()) {
        case "tab": 
            return 200
            break;
        case "chords":
            return 300
            break;
        default: 
            return null;
    }

}

function getSearchUrlFromQuery(artistSearchQuery, trackNameSearchQuery, type) {
    return baseSearchURL + "title=" + qs.escape(trackNameSearchQuery) + "&type=" + getTypeCode(type);
}

//filters urls to specifically 
//returns filtered array
function filterURLs(urls, artistSearchQuery) {
    //gets only tabs that come from the tabs list, then further filters the list for only the ones in the sought artist
        //also replaces spaces with dashes to work in the URL of the tab
        
    const baseSearchResultsUrl = "https://tabs.ultimate-guitar.com/tab/"
    urlsFilteredTabs = urls.filter((x) => {return x.indexOf(baseSearchResultsUrl) > -1})
    urlsFilteredArtist = urlsFilteredTabs.filter((x) => {return x.indexOf(shortenTrackName(artistSearchQuery).replace(/ /g, "-")) > -1})
    if (urlsFilteredArtist == undefined) return false;
    console.log("Filtered URLS" + urlsFilteredArtist)
    return urlsFilteredArtist
}

async function takeScreenshotsOfTab(artistSearchQuery, trackNameSearchQuery, type) {
    //clear files
    deleteFilesInDirectory('./tabs') //clears directory of previous tabs
    let browser
    //get search results list (this is where I should be checking ratings)
    try {
        if (browser && browser.process() != null) browser.process().kill('SIGINT'); //kills existing processes (not sure if it works)
        browser = await puppeteer.launch({ headless: true})
        const page = await browser.newPage()
        await page.goto(getSearchUrlFromQuery(artistSearchQuery, trackNameSearchQuery, type))
        await page.waitForSelector('a')

        //urls is an array of tabs with their href attributes
        const urls = await page.$$eval('a', anchors => {
            return anchors.map(anchor => 
                { 
                    return anchor.getAttribute("href") 
                }
            )
        })

        filteredUrls = filterURLs(urls, artistSearchQuery)
        //count ratings and get the URL with the highest rating (should be the most full stars and the highest count of ratings, with the former having precedence)
        //go to the printable page
        console.log("Going to tab page: " + filteredUrls[0])
        await page.goto(filteredUrls[0])
        console.log("Awaiting anchor element with the correct link...")
        await page.waitForSelector('a[href*="/tab/print?flats"]')
        //click button to download pdf (find button first)
        const printURL = await page.$('a[href*="/tab/print?flats"]')
        await page.waitForTimeout(5000); //waits a second as it seems Print button doesn't load in immediately

        await printURL.click({
                button: "middle",
                clickCount: 2 //I don't know why, but two clicks seems to help here!
            });


        console.log("printURL has been clicked")
        const newPagePromise = new Promise(res => browser.on('targetcreated', res))

        console.log("About to resolve promise... (code hangs here frequently)")
        await newPagePromise
        console.log("Promise resolved, now getting popup")
        const pages = await browser.pages()
        popup = pages[pages.length-1]
        await popup.setViewport({
            width: 3000,
            height: 1000,
            deviceScaleFactor: 2
        })
        console.log("Now waiting for the DIV with the lyrics class to appear")
        await popup.waitForSelector("div.page-container")
        console.log("Selector is there, about to iterate")

        const tabContainers = await popup.$$('div.page-container')
        console.log("There is this many tab containers: " + tabContainers.length)
        await popup.waitForTimeout(2000)
        //await captureScreenshotsOfElements(tabContainers, popup)
        let i = 0;
        for (let element of tabContainers) {
            await element.screenshot({ path: `tabs/${i}.png` });
            i += 1;
        }
        //note the above i value because we need to know how many screenshots were just taken
        //alternative I can empty out the tabs/ folder every time
    }
    catch (e) {
        console.log(e)
    }
    finally {
        console.log("Browser closing...")
        await browser?.close()   
    }
}

function deleteFilesInDirectory(dirPath) {
    fs.readdir(dirPath, (err, files) => {
        if (err) console.log(err);
        for (const file of files) {
            fs.unlink(path.join(dirPath, file), err => {
                if (err) console.log(err);
            });
        }
    });
}