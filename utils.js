module.exports = {
    getImageId: photos => photos[0].file_id,
    getDocumentId: document => document.file_id,
    getVideoId: vide => vide.file_id,
};