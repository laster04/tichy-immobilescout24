# Actor - ImmobileScout24 Scraper

## ImmobileScout24 scraper

The ImmobileScout24 data scraper supports the following features:

-   Scrape property details - You can scrape attributes like property images, price, features and many more. You can find details below.

-   Scrape for sale properties - If you are looking for a property which is for sale, you can directly target them.

-   Scrape rental properties - Rental properties can be directly targeted.

-   Scrape by keyword - You can use location-wise keywords to search specific search lists. Also you can directly point out rental, for sale or sold properties on this feature.

-   Scrape properties by filter - Auto detection of URLs helps you to directly copy/paste the URLs into the scraper to apply any filtering you like.
-   Through the new policy of web the exact location of some properties is hidden. So the scraper now get center of map which is accessible from detail of property.

## Input Parameters

The input of this scraper should be JSON containing the list of pages on Realtor that should be visited. Required fields are:

| Field        | Type    | Description                                                                                                     |
|--------------|---------|-----------------------------------------------------------------------------------------------------------------|
| country      | String  | (required) Select country where your search would be.                                                           |
| operation    | String  | (required) sale \| rent                                                                                         |
| propertyType | String  | (optional) You can choose property type (default **apartment**)                                                 |
| maxItems     | Integer | (optional) You can limit scraped products. This should be useful when you search through the big subcategories. |
| endPage      | Integer | (optional) Final number of page that you want to scrape. Default is 50 pages. This option overrides maxItems.   |
| inputCities  | Array   | (optional) List of ImmobilleScout URLs. You should only provide property detail or search URLs(beta)            |
| proxy        | Object  | (required) Proxy configuration                                                                                  |

This solution requires the use of **Proxy servers**, either your own proxy servers or you can use [Apify Proxy](https://www.apify.com/docs/proxy). Scraper works only with **RESIDENTIAL** proxies right now.

#### Example inputCities
```json
[
        {
            "id": 325,
            "name": "Innere Stadt",
            "url": "https://www.immobilienscout24.de/Suche/at/wien/wien/01-bezirk-innere-stadt/wohnung-kaufen?enteredFrom=result_list"
        },
        {
            "id": 345,
            "name": "Floridsdorf",
            "url": "https://www.immobilienscout24.de/Suche/at/wien/wien/21-bezirk-floridsdorf/wohnung-kaufen?enteredFrom=result_list"
        },
        {
            "id": 347,
            "name": "Liesing",
            "url": "https://www.immobilienscout24.de/Suche/at/wien/wien/23-bezirk-liesing/wohnung-kaufen?enteredFrom=result_list"
        }
    ]
```

## Example Result

``` json
{
    "operation": "sale",
    "url": "https://www.immobilienscout24.de/expose/165343984",
    "title": "+++ 2-Zimmer-Wohnung mit Dachterrasse und Stephansdom-Blick +++",
    "price": "1177000",
    "size": "144.72",
    "address": "Kumpfgasse xxx 1010, Wien",
    "typology": "no_information",
    "D_ID": 325,
    "D_NAME": "Innere Stadt"
  }
```

## Bugs, fixes, updates and changelog
If you have any feature requests you can create an issue from [here](https://github.com/laster04/Idealista-scraper/issues).
[Here](https://github.com/laster04/Idealista-scraper/blob/main/CHANGELOG.md) is changelog with new features and bugfixes info.
