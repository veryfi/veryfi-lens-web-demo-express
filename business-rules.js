const {DateTime} = require("luxon");
const black_list_ips = ['199.99.99.97', '199.99.99.98', '199.99.99.99'];
const REJECTED = 'REJECTED';
const APPROVED = 'APPROVED';
const MANUAL_REVIEW = 'MANUAL_REVIEW';
const DUPLICATED = 'DUPLICATED';
const NO_DOCUMENT = 'NO_DOCUMENT';
const NOT_VALID_AMOUNT = 'NOT_VALID_AMOUNT';
const NOT_VALID_DATE = 'NOT_VALID_DATE';
const FRAUD_DETECTED = 'FRAUD_DETECTED';
const LCD_DETECTED = 'LCD_DETECTED';
const NOT_VALID_COUNTRY = 'NOT_VALID_COUNTRY';
const NOT_VALID_VENDOR = 'NOT_VALID_VENDOR';
const BLOCKED_VENDOR = 'BLOCKED_VENDOR';
const PRODUCT_FOUND = 'PRODUCT_FOUND';
const NO_PRODUCT_FOUND = 'NO_PRODUCT_FOUND';
const PRODUCT_REJECTED = 'PRODUCT_REJECTED';
const HANDWRITTEN_DETECTED = 'HANDWRITTEN_DETECTED';
const VALID_VENDOR = 'VALID_VENDOR';
const MANUAL_REJECTED = 'MANUAL_REJECTED';
const FAILED_REQUEST = 'FAILED_REQUEST';
const Currencies = {
    ARS: 'ARS',
    COP: 'COP',
    CLP: 'CLP',
    USD: 'USD',
    MXN: 'MXN',
    PEN: 'PEN',
    BRL: 'BRL',
};

function validateBusinessRules(veryfi_client, json_response, ip_address) {
    if (json_response == null) {
        return {
            document_id: 0,
            vendor_name: '',
            vendor_raw_name: '',
            status: FAILED_REQUEST,
            image_url: ''
        };
    }
    const document_id = json_response.id.toString();
    const dateObject = DateTime.fromISO(json_response.date);
    const currentDate = DateTime.now();
    const thirtyDaysInMillis = 300 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    const differenceInMillis = currentDate.diff(dateObject).as('milliseconds');
    const tags = json_response.tags;
    const line_items = json_response.line_items;

    if (json_response.is_duplicate) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, DUPLICATED).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${DUPLICATED}`);
    }

    if (!json_response.is_document) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, NO_DOCUMENT).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${NO_DOCUMENT}`);
    }

    if (json_response.meta.fraud.color === 'red' && json_response.meta.fraud.attribution !== "Digital background") {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, FRAUD_DETECTED).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${FRAUD_DETECTED}`);
    }

    if (json_response.date === null) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, NOT_VALID_DATE).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${NOT_VALID_DATE}`);
    }

    if (differenceInMillis > thirtyDaysInMillis) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, NOT_VALID_DATE).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${NOT_VALID_DATE}`);
    }

    let is_valid_vendor = false;
    let rejected_found = false;
    let blocked_vendor = false;

    for (const tag of tags) {
        if (tag.name === VALID_VENDOR) {
            is_valid_vendor = true;
        }
        if (tag.name === MANUAL_REJECTED) {
            rejected_found = true;
        }
        if (tag.name === BLOCKED_VENDOR) {
            blocked_vendor = true;
        }
    }

    if (rejected_found) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${MANUAL_REJECTED}`);
    }

    let currency = json_response.currency_code
    if (json_response.currency_code !== Currencies.MXN) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, NOT_VALID_COUNTRY).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${NOT_VALID_COUNTRY}`);
    }

    let is_valid_amount = false;
    let total = json_response.total;
    switch (currency) {
        case Currencies.ARS:
            if (total >= 1000 && total <= 100000) {
                is_valid_amount = true;
            }
            break;
        case Currencies.COP:
            if (total >= 5000 && total <= 800000) {
                is_valid_amount = true;
            }
            break;
        case Currencies.CLP:
            if (total >= 4000 && total <= 400000) {
                is_valid_amount = true;
            }
            break;
        case Currencies.USD:
            if (total >= 3 && total <= 250) {
                is_valid_amount = true;
            }
            break;
        case Currencies.MXN:
            if (total >= 50 && total <= 50000) {
                is_valid_amount = true;
            }
            break;
        case Currencies.PEN:
            if (total >= 30 && total <= 3000) {
                is_valid_amount = true;
            }
            break;
        case Currencies.BRL:
            if (total >= 4 && total <= 700) {
                is_valid_amount = true;
            }
            break;
        default:
            is_valid_amount = true;
    }

    if (!is_valid_amount) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, NOT_VALID_AMOUNT).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${NOT_VALID_AMOUNT}`);
    }

    if (json_response?.meta?.handwritten_fields?.length > 0) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, HANDWRITTEN_DETECTED).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${HANDWRITTEN_DETECTED}`);
    }

    if (json_response?.meta?.fraud?.images?.[0]?.is_lcd && json_response?.meta?.fraud?.images?.[0]?.score >= 0.9) {
        veryfi_client.add_tag(document_id, REJECTED).then();
        veryfi_client.add_tag(document_id, LCD_DETECTED).then();
        return getDocumentInformation(json_response, `${REJECTED} ${LCD_DETECTED}`);
    }

    if (blocked_vendor) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${BLOCKED_VENDOR}`);
    }

    let has_upc = false;
    let has_products = false;
    let minTotal = 0;

    for (const line_item of line_items) {
        const {tags, custom_fields, product_details} = line_item;
        if (!tags.includes(PRODUCT_REJECTED) && tags.includes(PRODUCT_FOUND)) {
            has_products = true;
            minTotal = minTotal + line_item.total;
            if (custom_fields && custom_fields.upc) {
                has_upc = true;
            }
        }
        if (!tags.includes(PRODUCT_REJECTED) && product_details) {
            for (const product_detail of product_details) {
                if (product_detail.match_score > 0.2) {
                    has_products = true;
                    minTotal = minTotal + line_item.total;
                }
                if (product_detail.ean) {
                    has_upc = true;
                }
            }
        }
    }

    if (minTotal < 50) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, NOT_VALID_AMOUNT).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${NOT_VALID_AMOUNT}`);
    }

    if (black_list_ips.includes(ip_address)) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, FRAUD_DETECTED).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${FRAUD_DETECTED}`);
    }

    if (has_products && !is_valid_vendor) {
        veryfi_client.add_tag(document_id, MANUAL_REVIEW).then().catch();
        veryfi_client.add_tag(document_id, NOT_VALID_VENDOR).then().catch();
        return getDocumentInformation(json_response, `${MANUAL_REVIEW} ${NOT_VALID_VENDOR}`);
    }

    if (!has_products && is_valid_vendor) {
        veryfi_client.add_tag(document_id, MANUAL_REVIEW).then().catch();
        veryfi_client.add_tag(document_id, NO_PRODUCT_FOUND).then().catch();
        return getDocumentInformation(json_response, `${MANUAL_REVIEW} ${NO_PRODUCT_FOUND}`);
    }

    if (!has_products && !is_valid_vendor) {
        veryfi_client.add_tag(document_id, REJECTED).then().catch();
        veryfi_client.add_tag(document_id, NOT_VALID_VENDOR).then().catch();
        return getDocumentInformation(json_response, `${REJECTED} ${NOT_VALID_VENDOR}`);
    }

    if (has_products && is_valid_vendor) {
        veryfi_client.add_tag(document_id, APPROVED).then().catch();
        return getDocumentInformation(json_response, `${APPROVED}`);
    }

}

function getDocumentInformation(json_response, status) {
    const document_id = json_response.id.toString();
    const vendor_name = json_response.vendor.name;
    const image_url = json_response.img_url;
    console.log(status);
    return {
        document_id: document_id,
        vendor_name: vendor_name,
        status: status,
        image_url: image_url
    };
}

module.exports = validateBusinessRules;
