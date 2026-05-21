const SEARCH_TYPE_REGION = 'region';
const SEARCH_TYPE_SHAPE = 'shape';
const BASE_SEARCH_URL = (searchType = SEARCH_TYPE_REGION) => `https://api.mobile.immobilienscout24.de/search/list?features=adKeysAndStringValues,virtualTour,contactDetails,additionalImages,viareporting,nextgen,calculatedTotalRent,listingsInListFirstSummary,xxlListingType,quickfilters,grouping,projectsInAllRealestateTypes,fairPrice&pagesize=20&searchType=${searchType}&sorting=standard&channel=is24`;
const OPERATION_SALE = 'sale';

function getSearchUrl( inputQuery ) {
    const { geocodes, realestateType, operation, pageNumber = 1, min = null, max = null } = inputQuery;
    const realEstateQuery = getRealEstateTypeOperation(realestateType, operation);
    const priceQuery = getPriceFilter(min, max);
    return `${BASE_SEARCH_URL(SEARCH_TYPE_REGION)}&geocodes=${geocodes}&pagenumber=${pageNumber}&${realEstateQuery}&${priceQuery}`;
}
function getShapeSearchUrl( inputQuery ) {
    const { shape, realestateType, operation, pageNumber = 1, min = null, max = null } = inputQuery;
    const realEstateQuery = getRealEstateTypeOperation(realestateType, operation);
    const priceQuery = getPriceFilter(min, max);
    return `${BASE_SEARCH_URL(SEARCH_TYPE_SHAPE)}&shape=${encodeURIComponent(shape)}&pagenumber=${pageNumber}&${realEstateQuery}&${priceQuery}`;
}

function getRealEstateTypeOperation(realestateType, operation) {
    switch (realestateType) {
        case 'apartment':
            if (operation === OPERATION_SALE) {
                return 'realestatetype=apartmentbuy';
            } else {
                return 'realestatetype=apartmentrent&priceType=calculatedtotalrent';
            }
        case 'house':
            if (operation === OPERATION_SALE) {
                return 'realestatetype=housebuy';
            } else {
                return 'realestatetype=houserent';
            }
        case 'plot':
            if (operation === OPERATION_SALE) {
                return 'realestatetype=livingbuysite&priceType=buy';
            } else {
                return 'realestatetype=livingrentsite&priceType=rent';
            }
        case 'solid-house':
            if (operation === OPERATION_SALE) {
                return 'realestatetype=housetype&priceType=buy';
            } else {
                throw "Can't use rent for Solid house - Property type"
            }
        case 'shorttermaccommodation':
            if (operation === OPERATION_SALE) {
                throw "Can't use sale for Temporary living - Property type"
            } else {
                return 'realestatetype=shorttermaccommodation';
            }
        case 'flatshareroom':
            if (operation === OPERATION_SALE) {
                throw "Can't use sale for Shared flat - Property type"
            } else {
                return 'realestatetype=flatshareroom';
            }
        case 'garage':
            if (operation === OPERATION_SALE) {
                return 'realestatetype=garagebuy';
            } else {
                return 'realestatetype=garagerent';
            }
        case 'office':
            if (operation === OPERATION_SALE) {
                return 'priceType=buy&realestatetype=office';
            } else {
                return 'priceType=rentpermonth&realestatetype=office';
            }
        case 'store':
            if (operation === OPERATION_SALE) {
                return 'priceType=buy&realestatetype=store';
            } else {
                return 'priceType=rentpermonth&realestatetype=store';
            }
        case 'industry':
            if (operation === OPERATION_SALE) {
                return 'priceType=buy&realestatetype=industry';
            } else {
                return 'priceType=rentpermonth&realestatetype=industry';
            }
        case 'gastronomy':
            if (operation === OPERATION_SALE) {
                return 'priceType=buy&realestatetype=industry';
            } else {
                return 'priceType=lease&realestatetype=industry';
            }
        case 'tradesite':
            if (operation === OPERATION_SALE) {
                return 'priceType=buy&realestatetype=tradesite';
            } else {
                return 'priceType=rent&realestatetype=tradesite';
            }
        case 'specialpurpose':
            if (operation === OPERATION_SALE) {
                return 'priceType=buy&realestatetype=specialpurpose';
            } else {
                return 'priceType=rentpermonth&realestatetype=specialpurpose';
            }
        case 'investment':
            if (operation === OPERATION_SALE) {
                return 'realestatetype=investment';
            } else {
                throw "Can't use rent for Investment - Property type"
            }
        case 'compulsoryauction':
            if (operation === OPERATION_SALE) {
                return 'realestatetype=compulsoryauction';
            } else {
                throw "Can't use rent for Compulsory auction - Property type"
            }
    }
}

function getPriceFilter(min, max) {
    let priceQuery = "-";

    if (min != null) {
        priceQuery = `${min}${priceQuery}`;
    }
    if (max != null) {
        priceQuery = `${priceQuery}${max}`;
    }
    return `price=${priceQuery}`;
}

const SLUG_TO_REALESTATE = {
    'wohnung-kaufen': { propertyType: 'apartment', operation: 'sale' },
    'wohnung-mieten': { propertyType: 'apartment', operation: 'rent' },
    'haus-kaufen':    { propertyType: 'house',     operation: 'sale' },
    'haus-mieten':    { propertyType: 'house',     operation: 'rent' },
    'grundstueck':    { propertyType: 'plot',      operation: 'sale' },
    'garage-kaufen':  { propertyType: 'garage',    operation: 'sale' },
    'garage-mieten':  { propertyType: 'garage',    operation: 'rent' },
    'buero-kaufen':   { propertyType: 'office',    operation: 'sale' },
    'buero-mieten':   { propertyType: 'office',    operation: 'rent' },
};

function parseShapeUrl(inputUrl) {
    const u = new URL(inputUrl);
    const shapeEncoded = u.searchParams.get('shape');
    // Website URL encodes polyline as base64url; API expects the raw polyline string
    const shape = Buffer.from(shapeEncoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const pathParts = u.pathname.split('/').filter(Boolean);
    const slug = pathParts[pathParts.indexOf('shape') + 1] ?? '';
    const { propertyType, operation } = SLUG_TO_REALESTATE[slug] ?? { propertyType: 'apartment', operation: 'sale' };
    return { shape, propertyType, operation };
}

export {
    getSearchUrl,
    getShapeSearchUrl,
    parseShapeUrl,
}
