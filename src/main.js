import { Actor } from 'apify';
import { log, CheerioCrawler} from '@crawlee/cheerio';
import { BASIC_HEADERS, LABELS, LISTING_BODY, MAX_ITEMS_STAT_NAME } from './consts.js';
import { handleDistrictSearch, handleProperty, handlePropertyList } from './routes.js';
import { getSearchUrl } from './ListingSearchHelper.js';

await Actor.init();

const userInput = await Actor.getInput();
const {
    inputCities = [],
    district = null,
    onlyNewest = false,
    proxy,
    maxItems,
    minPrice = null,
    maxPrice = null,
    debugLog = false,
    country = 'de',
    operation = 'sale',
    propertyType = 'apartment',
} = userInput;

if (!district && inputCities.length === 0) {
    await Actor.fail('You have to input district param or any inputCities to run crawler..');
}

const proxyConfiguration = await Actor.createProxyConfiguration(proxy);
const requestQueue = await Actor.openRequestQueue();

if (inputCities.length > 0) {
    for (const { url, id, name } of inputCities) {
        if (url.match(/\/expose/)) {
            const propertyId = url.match(/expose\/([a-z\d]+)/)[1];
            await requestQueue.addRequest({
                url: `https://api.mobile.immobilienscout24.de/expose/${propertyId}`,
                method: 'GET',
                headers: BASIC_HEADERS,
                userData: {
                    label: LABELS.PROPERTY,
                },
            });
        } else if (url.match(/\/Suche\//)) {
            let u = url.replaceAll('https://www.immobilienscout24.de/Suche/', '');
            let uArr = u.split('/');
            let geopath = '';
            for(let i = 0; i < uArr.length - 1; i++) {
                geopath += '/'+uArr[i];
            }


            const searchUrl = getSearchUrl({
                geocodes: geopath,
                realestateType: propertyType,
                operation: operation,
                pageNumber: 1,
                min: minPrice,
                max: maxPrice
            });
            await requestQueue.addRequest({
                url: searchUrl,
                method: 'POST',
                uniqueKey: `${geopath}-1`,
                payload: JSON.stringify(LISTING_BODY),
                headers: BASIC_HEADERS,
                userData: {
                    label: LABELS.PROPERTY_LIST,
                    item: {
                        id, name
                    },
                    requestPayload: {
                        geopath: geopath,
                        pageNumber: 1,
                        maxItems: 20,
                        ...userInput,
                    },
                },
            });
        }
    }
}

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl: maxItems,
    maxConcurrency: 50,
    maxRequestRetries: 8,
    requestQueue,
    async requestHandler(context) {
        const {
            url,
            userData: { label }
        } = context.request;
        log.info('Page opened.', {
            label,
            url
        });

        switch (label) {
            case LABELS.DISTRICT_SEARCH:
                return handleDistrictSearch(context, proxyConfiguration);
            case LABELS.PROPERTY_LIST:
                return handlePropertyList(context, {
                    userInput,
                    onlyNewest
                });
            case LABELS.PROPERTY:
                return handleProperty(context, proxyConfiguration);
            default:
                log.warning('Unknown label');
        }
    },
});

log.info('Starting the crawl.');
await crawler.run();

await Actor.exit();
