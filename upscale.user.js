// ==UserScript==
// @name        Stash Performer Image Upscaler
// @namespace
// @match       http://localhost:9999/*
// @version     1.0
// @author      Echoman
// @require      https://raw.githubusercontent.com/7dJx1qP/stash-userscripts/master/src\StashUserscriptLibrary.js
// @require     https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js
// @require     https://cdn.jsdelivr.net/npm/upscaler@1.0.0-beta.17/dist/browser/umd/upscaler.min.js
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

  GM_addStyle(`
        .upscale-container {
            margin: 0 auto;
        }
        .upscale-btn-container {
          text-align: center;
        }
        .radio-container {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        .radio-container label {
          margin-right: 0.4rem;
        }
    `);

  stash.addEventListener("page:performer", function () {
    waitForElementClass("detail-header collapsed", function () {
      const upscaleContainerId = "upscale-container";

      function create() {
        if (!document.getElementById(upscaleContainerId)) {
          const performerId = window.location.pathname
            .replace("/performers/", "")
            .split("/")[0];
          const image = getElementByXpath(
            "//div[contains(@class, 'detail-header-image')]//img[@class='performer']"
          );
          image.parentElement.addEventListener("click", (evt) => {
            if (upscaling) {
              evt.preventDefault();
              evt.stopPropagation();
            }
          });

          const upscaleBtnContainer = document.createElement("div");
          upscaleBtnContainer.setAttribute("id", upscaleContainerId);
          upscaleBtnContainer.classList.add(upscaleContainerId);

          const subContainer = document.createElement("div");
          subContainer.classList.add("upscale-btn-container");
          upscaleBtnContainer.appendChild(subContainer);

          image.parentElement.parentElement.appendChild(upscaleBtnContainer);
          const upscaleInfo = document.createElement("p");
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
          subContainer.appendChild(upscaleStart);

          const modelNames = [
            {
              name: "Slim X2",
              value: "esrganSlim2",
              path: "/custom/models/esrgan-slim/models/2x/model.json",
              scale: 2,
            },
            {
              name: "Slim X3",
              value: "esrganSlim3",
              path: "/custom/models/esrgan-slim/models/3x/model.json",
              scale: 3,
            },
            {
              name: "Slim X4",
              value: "esrganSlim4",
              path: "/custom/models/esrgan-slim/models/4x/model.json",
              scale: 4,
            },
            {
              name: "Medium X2",
              value: "esrganMedium2",
              path: "/custom/models/esrgan-medium/models/2x/model.json",
              scale: 2,
            },
            {
              name: "Medium X3",
              value: "esrganMedium3",
              path: "/custom/models/esrgan-medium/models/3x/model.json",
              scale: 3,
            },
            {
              name: "Medium X4",
              value: "esrganMedium4",
              path: "/custom/models/esrgan-medium/models/4x/model.json",
              scale: 4,
            },
            {
              name: "Thick X2",
              value: "esrganThick2",
              path: "/custom/models/esrgan-thick/models/2x/model.json",
              scale: 2,
            },
            {
              name: "Thick X3",
              value: "esrganThick3",
              path: "/custom/models/esrgan-thick/models/3x/model.json",
              scale: 3,
            },
            {
              name: "Thick X4",
              value: "esrganThick4",
              path: "/custom/models/esrgan-thick/models/4x/model.json",
              scale: 4,
            },
          ];

          const radioContainer = document.createElement("div");
          radioContainer.style.display = "none";
          radioContainer.classList.add("radio-container");

          const radioDIVSlim = document.createElement("div");
          const radioDIVMedium = document.createElement("div");
          const radioDIVThick = document.createElement("div");

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
                  console.log("Error disposing upscaler:", e);
                }
              }

              upscaleAccept.style.display = "inline-block";

              upscaler = new window.Upscaler({
                model: {
                  path: modelNames[i].path,
                  scale: modelNames[i].scale,
                },
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
                    console.log("Error disposing upscaler:", e);
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
                    console.log("Error disposing upscaler:", e);
                  }
                }

                modalBackdrop.remove();
                modalCompnent.remove();
              });
              modalbody.append(upscaleCancelNew);
            });
          });

          subContainer.appendChild(upscaleAccept);

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

          subContainer.appendChild(upscaleCancel);
          upscaleAccept.style.display = "none";
          upscaleCancel.style.display = "none";
          subContainer.appendChild(upscaleInfo);
        }
      }

      let checkExist = setInterval(function () {
        if (!document.getElementById(upscaleContainerId)) {
          create();
        } else {
          clearInterval(checkExist);
        }
      }, 100);
    });
  });
})();