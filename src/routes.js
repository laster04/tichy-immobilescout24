import { Dataset,log } from '@crawlee/cheerio';

import { BASIC_HEADERS, LABELS, LISTING_BODY } from './consts.js';
import { getSearchUrl } from './ListingSearchHelper.js';

export const handleDistrictSearch = async (context) => {
    const { json, crawler: { requestQueue }, request: { userData } } = context;
    const { userInput } = userData;
    log.info(`Found ${json.results.length}`);
    const foundLocation = json.results[0];
    log.info('Pick:', { data: json.results[0] })

    const url = getSearchUrl({
        geocodes: foundLocation.geopath,
        realestateType: userInput.propertyType,
        operation: userInput.operation,
        pageNumber: 1,
        min: userInput.minPrice,
        max: userInput.maxPrice
    });

    await requestQueue.addRequest({
        url,
        method: 'POST',
        uniqueKey: `${foundLocation.geopath}-1`,
        payload: JSON.stringify(LISTING_BODY),
        headers: BASIC_HEADERS,
        userData: {
            ...userData,
            label: LABELS.PROPERTY_LIST,
            requestPayload: {
                geopath: foundLocation.geopath,
                pageNumber: 1,
                maxItems: 20,
                ...userInput,
            },
        },
    });
}

export const handlePropertyList = async (context, { userInput }) => {
    const { json, crawler: { requestQueue }, request: { userData } } = context;
    const { maxItems, endPage = 10 } = userInput;
    const { requestPayload : body } = userData;

    let items = (body.pageNumber - 1) * body.maxItems;
    let processedItems = items;
    for (const article of json.resultListItems) {
        if (processedItems >= maxItems) {
            break;
        }
        if (article.type !== 'EXPOSE_RESULT') continue;

        await requestQueue.addRequest({
            url: `https://api.mobile.immobilienscout24.de/expose/${article.item.id}`,
            method: 'GET',
            headers: BASIC_HEADERS,
            userData: {
                ...userData,
                label: LABELS.PROPERTY,
            },
        });
        processedItems++;
    }
    items = processedItems;
    let page = body.pageNumber;
    if (page === 1) {
        log.info(`Total pageItems ${json.totalResults}`);
    }
    if (items < json.totalResults && page <= endPage) {
        if (maxItems !== null && items > maxItems){

        } else {
            body.pageNumber = page + 1;
            const url = getSearchUrl({
                geocodes: body.geopath,
                realestateType: body.propertyType,
                operation: body.operation,
                pageNumber: body.pageNumber,
                min: body.minPrice,
                max: body.maxPrice
            });

            await requestQueue.addRequest({
                url,
                uniqueKey: `${body.geopath}-${body.pageNumber}-${body.propertyType}`,
                method: 'POST',
                payload: JSON.stringify(LISTING_BODY),
                headers: BASIC_HEADERS,
                userData: {
                    ...userData,
                    label: LABELS.PROPERTY_LIST,
                    requestPayload: body,
                },
            });
        }
    }
};

export const handleProperty = async (context) => {
    const { json, request: { userData: { requestPayload, item } } } = context;
    const prop = handleOneProperty(json, requestPayload.operation);
    prop.D_ID = item.id;
    prop.D_NAME = item.name;
    prop.MOTHER_ID = item.mother;
    prop.AI_DATA = [
        `ADDRESS: ${prop.address ?? ''}`,
        `DESCRIPTION: ${prop.description ?? ''}`,
        `LATITUDE: ${prop.latitude ?? ''}`,
        `LONGITUDE: ${prop.longitude ?? ''}`,
        `MUNICIPALITY: ${prop.municipality ?? ''}`,
        `NEIGHBORHOOD: ${prop.neighborhood ?? ''}`,
        `NEW DEVELOPMENT: ${prop.newDevelopment ?? ''}`,
        `PARKING: ${prop.parking ?? ''}`,
        `BUILDING_QUALITY: ${prop.buildingQuality ?? ''}`,
        `AIR_CONDITION: ${prop.airCondition ?? ''}`,
        `GARDEN: ${prop.garden ?? ''}`,
        `POOL: ${prop.pool ?? ''}`,
        `BALCONY: ${prop.balcony ?? ''}`,
        `FLOOR: ${prop.floor ?? ''}`,
        `LIFT: ${prop.lift ?? ''}`,
        `ENERGY_TYPE: ${prop.energyType ?? ''}`,
        `ENERGY_CLASS: ${prop.energyClass ?? ''}`,
        `FIRING_TYPE: ${prop.firingType ?? ''}`,
        `HEATING_TYPE: ${prop.heatingType ?? ''}`,
        `CELLAR: ${prop.cellar ?? ''}`,
        `RENOVATION: ${prop.renovation ?? ''}`,
    ].join('\n');

    await Dataset.pushData(prop);
};


const handleOneProperty = (property, operation) => {
    const { adTargetingParameters } = property;
    const descriptions = [];
    const output = {
        operation: operation,
        price: operation === 'rent' ? adTargetingParameters.obj_baseRent : adTargetingParameters.obj_purchasePrice,
        size: adTargetingParameters.obj_livingSpace,
        typology: adTargetingParameters.obj_typeOfFlat,
        url: `https://www.immobilienscout24.de/expose/${property.header.id}`,
        balcony: adTargetingParameters.obj_balcony,
        buildingQuality: adTargetingParameters.obj_condition,
        cellar: adTargetingParameters.obj_cellar,
        energyType: adTargetingParameters.obj_energyType,
        firingType: adTargetingParameters.obj_firingTypes,
        energyClass: adTargetingParameters.obj_energyEfficiencyClass,
        floor: adTargetingParameters.obj_floor,
        garden: adTargetingParameters.obj_garden,
        heatingType: adTargetingParameters.obj_heatingType,
        lift: adTargetingParameters.obj_lift,
        newDevelopment: adTargetingParameters.obj_newlyConst,
        parking: adTargetingParameters.obj_noParkSpaces,
        renovation: adTargetingParameters.obj_lastRefurbish,
    }
    for (const section of property.sections) {
        switch (section.type) {
            case 'TITLE':
                output.title = section.title;
                break;
            case 'MEDIA':
                // output.photos = section.media.filter(m => m.type === 'PICTURE').map(m => m.fullImageUrl);
                // output.tour3d = section.media.filter(m => m.type === 'VIRTUAL_TOUR').map(m => m.url);
                break;
            case 'MAP':
                output.latitude = section?.location?.lat;
                output.longitude = section?.location?.lng;
                output.address = section.addressLine2;
                break;
            case 'TRAVELTIME':
                if (section.address && !section.isBlocked) {
                    output.address = section.address;
                }
                break;
            case 'TEXT_AREA':
                descriptions.push(section.text);
                break;
            case 'TOP_ATTRIBUTES':
            case 'ATTRIBUTE_LIST':
                for (const attr of section.attributes) {
                    switch (attr.label) {
                        case 'Bathrooms:':
                            output.baths = attr.text
                            break;
                        case 'Total rent:':
                            if (output.price.length === 0) {
                                output.price = attr.text
                            }
                            break;
                        case 'Rooms':
                            output.rooms = attr.text
                            break;
                        case 'Apartment type:':
                            output.subTypology = attr.text
                            break;
                    }
                }
                break;
        }
    }
    output.description = descriptions.join('\n\n');

    return output;
}
