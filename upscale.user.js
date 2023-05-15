// ==UserScript==
// @name        Stash Performer Image Upscaler
// @namespace
// @match       http://localhost:9999/*
// @version     1.0
// @author      Echoman
// @require      https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// @require     https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js
// @require     https://cdn.jsdelivr.net/npm/upscaler@1.0.0-beta.16/dist/browser/umd/upscaler.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-slim@1.0.0-beta.8/dist/umd/2x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-slim@1.0.0-beta.8/dist/umd/3x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-slim@1.0.0-beta.8/dist/umd/4x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-medium@1.0.0-beta.9/dist/umd/2x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-medium@1.0.0-beta.9/dist/umd/3x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-medium@1.0.0-beta.9/dist/umd/4x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@1.0.0-beta.11/dist/umd/2x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@1.0.0-beta.11/dist/umd/3x.min.js
// @require     https://cdn.jsdelivr.net/npm/@upscalerjs/esrgan-thick@1.0.0-beta.11/dist/umd/4x.min.js
// @grant       unsafeWindow
// @grant       GM.getResourceText
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    "use strict";
  
    let headerSVG =
      '<svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" width="1em" height="1em"><style>.s0 { fill: none;stroke: #ffffff;stroke-linecap: round;stroke-linejoin: round;stroke-width: 2 } </style><path id="Layer" class="s0" d="m16 4c0.9 0 1.4 0 1.8 0.1 1 0.3 1.8 1.1 2.1 2.1 0.1 0.4 0.1 0.9 0.1 1.8v9.2c0 1.7 0 2.5-0.3 3.2-0.3 0.5-0.8 1-1.3 1.3-0.7 0.3-1.5 0.3-3.2 0.3h-6.4c-1.7 0-2.5 0-3.2-0.3-0.5-0.3-1-0.8-1.3-1.3-0.3-0.7-0.3-1.5-0.3-3.2v-9.2c0-0.9 0-1.4 0.1-1.8 0.3-1 1.1-1.8 2.1-2.1 0.4-0.1 0.9-0.1 1.8-0.1m4 13l-3-3m3 3l3-3m-3-3v6m-3.5-11.1q-0.2-0.2-0.4-0.4c-0.1-0.3-0.1-0.5-0.1-1.1v-0.8c0-0.6 0-0.8 0.1-1.1q0.2-0.2 0.4-0.4c0.3-0.1 0.5-0.1 1.1-0.1h4.8c0.6 0 0.8 0 1.1 0.1q0.2 0.2 0.4 0.4c0.1 0.3 0.1 0.5 0.1 1.1v0.8c0 0.6 0 0.8-0.1 1.1q-0.2 0.2-0.4 0.4c-0.3 0.1-0.5 0.1-1.1 0.1h-4.8c-0.6 0-0.8 0-1.1-0.1z"/></svg>';
  
    const {
      stash,
      Stash,
      waitForElementId,
      waitForElementClass,
      waitForElementByXpath,
      getElementByXpath,
      getClosestAncestor,
      updateTextInput,
      reloadImg,
    } = unsafeWindow.stash;
  
    let upscaling = false;
    let upscaler = null;
    let selectedModel;
  
    stash.addEventListener("page:performer", function () {
      waitForElementId("performer-details-tab-details", function () {
        const upscaleBtnContainerId = "upscale-btn-container";
  
        function create() {
          if (!document.getElementById(upscaleBtnContainerId)) {
            const performerId = window.location.pathname
              .replace("/performers/", "")
              .split("/")[0];
            const image = getElementByXpath(
              "//div[contains(@class, 'performer-image-container')]//img[@class='performer']"
            );
            image.parentElement.addEventListener("click", (evt) => {
              if (upscaling) {
                evt.preventDefault();
                evt.stopPropagation();
              }
            });
  
            const upscaleBtnContainer = document.createElement("div");
            upscaleBtnContainer.setAttribute("id", upscaleBtnContainerId);
            image.parentElement.parentElement.appendChild(upscaleBtnContainer);
            const upscaleInfo = document.createElement("p");
            const imageUrl = getElementByXpath(
              "//div[contains(@class, 'performer-image-container')]//img[@class='performer']/@src"
            ).nodeValue;
            const upscaleStart = document.createElement("button");
            upscaleStart.setAttribute("id", "upscale-start");
            upscaleStart.classList.add("btn", "btn-primary");
            upscaleStart.innerText = "Upscale Image";
            upscaleStart.addEventListener("click", (evt) => {
              upscaling = true;
              upscaleStart.style.display = "none";
              upscaleCancel.style.display = "inline-block";
              radioContainer.style.display = "flex";
            });
            upscaleBtnContainer.appendChild(upscaleStart);
  
            const modelNames = [
              {
                name: "Slim X2",
                value: "esrganSlim2",
                model: "window.ESRGANSlim2x",
              },
              {
                name: "Slim X3",
                value: "esrganSlim3",
                model: "window.ESRGANSlim3x",
              },
              {
                name: "Slim X4",
                value: "esrganSlim4",
                model: "window.ESRGANSlim4x",
              },
              {
                name: "Medium X2",
                value: "esrganMedium2",
                model: "window.ESRGANMedium2x",
              },
              {
                name: "Medium X3",
                value: "esrganMedium3",
                model: "window.ESRGANMedium3x",
              },
              {
                name: "Medium X4",
                value: "esrganMedium4",
                model: "window.ESRGANMedium4x",
              },
              {
                name: "Thick X2",
                value: "esrganThick2",
                model: "window.ESRGANThick2x",
              },
              {
                name: "Thick X3",
                value: "esrganThick3",
                model: "window.ESRGANThick3x",
              },
              {
                name: "Thick X4",
                value: "esrganThick4",
                model: "window.ESRGANThick4x",
              },
            ];
  
            const radioContainer = document.createElement("div");
            radioContainer.style.display = "none";
  
            const radioDIVSlim = document.createElement("div");
            radioDIVSlim.style.display = "inline-block";
            radioDIVSlim.style.width = "33%";
            radioDIVSlim.style.marginRight = "1rem";
  
            const radioDIVMedium = document.createElement("div");
            radioDIVMedium.style.display = "inline-block";
            radioDIVMedium.style.width = "33%";
            radioDIVMedium.style.marginRight = "1rem";
  
            const radioDIVThick = document.createElement("div");
            radioDIVThick.style.display = "inline-block";
            radioDIVThick.style.width = "33%";
            radioDIVThick.style.marginRight = "1rem";
  
            for (let i = 0; i < modelNames.length; i++) {
              const radio = document.createElement("input");
              radio.name = "upscaler-model";
              radio.setAttribute("id", modelNames[i].value);
              radio.type = "radio";
              radio.addEventListener("click", (evt) => {
  
                if (upscaler) {
                  try {
                    upscaler.dispose();
                  } catch (e) {
                    console.log('Error disposing upscaler:', e);
                  }
                }
  
                upscaleAccept.style.display = "inline-block";
                upscaler = new window.Upscaler({
                  model: eval(modelNames[i].model),
                });
              });
  
              const lineBreak = document.createElement("br");
              const label = document.createElement("label");
              label.setAttribute("for", modelNames[i].value);
              label.innerHTML = modelNames[i].name;
  
              if (i <= 2) {
                radioDIVSlim.appendChild(radio);
                radioDIVSlim.appendChild(label);
                radioDIVSlim.appendChild(lineBreak);
              } else if (i <= 5) {
                radioDIVMedium.appendChild(radio);
                radioDIVMedium.appendChild(label);
                radioDIVMedium.appendChild(lineBreak);
              } else if (i <= 8) {
                radioDIVThick.appendChild(radio);
                radioDIVThick.appendChild(label);
                radioDIVThick.appendChild(lineBreak);
              }
            }
  
            radioContainer.appendChild(radioDIVSlim);
            radioContainer.appendChild(radioDIVMedium);
            radioContainer.appendChild(radioDIVThick);
            upscaleBtnContainer.appendChild(radioContainer);
  
            const upscaleAccept = document.createElement("button");
            upscaleAccept.setAttribute("id", "upscale-accept");
            upscaleAccept.classList.add("btn", "btn-success", "mr-2");
            upscaleAccept.innerText = "OK";
  
            upscaleAccept.addEventListener("click", async (evt) => {
              upscaling = false;
              radioContainer.style.display = "none";
              upscaleStart.style.display = "inline-block";
              upscaleAccept.style.display = "none";
              upscaleCancel.style.display = "none";
              upscaleInfo.innerText = "";
              upscaleInfo.innerText = "Upscaling...";
  
              const start = new Date().getTime();
  
              upscaler.upscale(image).then((upscaledImgSrc) => {
                const modalBackdrop = document.createElement("div");
                modalBackdrop.setAttribute("id", "fade modal-backdrop show");
                const modalCompnent = document.createElement("div");
                modalCompnent.setAttribute(
                  "class",
                  "fade ModalComponent modal show"
                );
                modalCompnent.setAttribute("tabindex", "-1");
                modalCompnent.setAttribute(
                  "style",
                  "display: flex; overflow: auto;"
                );
  
                const modalDialog = document.createElement("div");
                modalDialog.setAttribute("class", "modal-dialog");
                modalDialog.setAttribute("style", "max-width: unset;");
  
                const modalContent = document.createElement("div");
                modalContent.setAttribute("class", "modal-content");
  
                const modalHeader = document.createElement("div");
                modalHeader.setAttribute("class", "modal-header");
                modalHeader.setAttribute(
                  "style",
                  "display: inline-block; vertical-align: middle;"
                );
                modalHeader.innerHTML = headerSVG;
  
                const headerSpan = document.createElement("span");
                headerSpan.innerHTML = "Image Upscaler";
                modalHeader.append(headerSpan);
  
                const modalbody = document.createElement("div");
                modalbody.setAttribute("class", "modal-body");
  
                const modalTarget = document.createElement("div");
                modalTarget.setAttribute("id", "upscaler-modal-target");
                modalTarget.setAttribute("style", "display: flex;");
  
                modalbody.append(modalTarget);
                modalContent.append(modalHeader);
                modalContent.append(modalbody);
                modalDialog.append(modalContent);
                modalCompnent.append(modalDialog);
                document.body.appendChild(modalBackdrop);
                document.body.appendChild(modalCompnent);
  
                const originalImageDIV = document.createElement("div");
                originalImageDIV.setAttribute("style", "margin-right: 5px;");
  
                const originalImageDIVHeader = document.createElement("div");
                originalImageDIVHeader.innerHTML = "Original Image";
                originalImageDIV.appendChild(originalImageDIVHeader);
  
                const originalImageContainer = document.createElement("div");
                const originalImage = document.createElement("img");
                originalImage.src = image.src;
                originalImage.setAttribute("id", "upscaler-original-image");
                originalImageContainer.appendChild(originalImage);
                originalImageDIV.appendChild(originalImageContainer);
  
                const newImageDIV = document.createElement("div");
                const newImageDIVHeader = document.createElement("div");
                newImageDIVHeader.innerHTML = "New Image";
                newImageDIV.appendChild(newImageDIVHeader);
  
                const newImageContainer = document.createElement("div");
                const img = new Image();
                img.src = upscaledImgSrc;
  
                const newImage = document.createElement("img");
                newImage.src = img.src;
                newImage.setAttribute("id", "upscaler-upscaled-image");
                newImageContainer.appendChild(newImage);
                newImageDIV.appendChild(newImageContainer);
                modalTarget.appendChild(originalImageDIV);
                modalTarget.appendChild(newImageDIV);
  
                const ms = new Date().getTime() - start;
                upscaleInfo.innerText = `Upscaled in ${ms} ms`;
  
                const updateInfoNew = document.createElement("div");
                updateInfoNew.innerText = `Upscaled in ${ms} ms`;
                modalbody.append(updateInfoNew);
  
                const upscaleAcceptProcessed = document.createElement("button");
                upscaleAcceptProcessed.setAttribute("id", "upscale-accept");
                upscaleAcceptProcessed.classList.add(
                  "btn",
                  "btn-success",
                  "mr-2"
                );
                upscaleAcceptProcessed.innerText = "Save Image";
                upscaleAcceptProcessed.addEventListener("click", async (evt) => {
  
                  const reqData = {
                    operationName: "PerformerUpdate",
                    variables: {
                      input: {
                        image: upscaledImgSrc,
                        id: performerId,
                      },
                    },
  
                    query: `mutation PerformerUpdate($input: PerformerUpdateInput!) {
                                      performerUpdate(input: $input) {
                                      id
                                      }
                                  }`,
                  };
  
                  await stash.callGQL(reqData);
                  reloadImg(image.src);
                  modalBackdrop.remove();
                  modalCompnent.remove();
  
                  if (upscaler) {
                    try {
                      upscaler.dispose();
                    } catch (e) {
                      console.log('Error disposing upscaler:', e);
                    }
                  }
                });
  
                modalbody.append(upscaleAcceptProcessed);
  
                const upscaleCancelNew = document.createElement("button");
                upscaleCancelNew.setAttribute("id", "upscale-accept");
                upscaleCancelNew.classList.add("btn", "btn-danger");
                upscaleCancelNew.innerText = "Cancel";
                upscaleCancelNew.addEventListener("click", (evt) => {
                  upscaling = false;
                  upscaleStart.style.display = "inline-block";
                  upscaleAccept.style.display = "none";
                  upscaleCancelNew.style.display = "none";
                  upscaleInfo.innerText = "";
                  radioContainer.style.display = "none";
  
                  if (upscaler) {
                    try {
                      upscaler.dispose();
                    } catch (e) {
                      console.log('Error disposing upscaler:', e);
                    }
                  }
  
                  modalBackdrop.remove();
                  modalCompnent.remove();
                });
                modalbody.append(upscaleCancelNew);
              });
            });
  
            upscaleBtnContainer.appendChild(upscaleAccept);
  
            const upscaleCancel = document.createElement("button");
            upscaleCancel.setAttribute("id", "upscale-accept");
            upscaleCancel.classList.add("btn", "btn-danger");
            upscaleCancel.innerText = "Cancel";
            upscaleCancel.addEventListener("click", (evt) => {
              upscaling = false;
              upscaleStart.style.display = "inline-block";
              upscaleAccept.style.display = "none";
              upscaleCancel.style.display = "none";
              upscaleInfo.innerText = "";
              radioContainer.style.display = "none";
  
              if (upscaler) {
                upscaler.dispose();
              }
            });
  
            upscaleBtnContainer.appendChild(upscaleCancel);
            upscaleAccept.style.display = "none";
            upscaleCancel.style.display = "none";
            upscaleBtnContainer.appendChild(upscaleInfo);
          }
        }
  
        let checkExist = setInterval(function () {
          if (!document.getElementById(upscaleBtnContainerId)) {
            create();
          } else {
            clearInterval(checkExist);
          }
        }, 100);
      });
    });
  })();
  