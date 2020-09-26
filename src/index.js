import "./styles.css";

const selectAll = (query) => Array.from(document.querySelectorAll(query));
const cached = (() => {
  let cache = new Map();
  return (key, initFn) => {
    if (cache.has(key)) return cache.get(key);
    const data = initFn(key);
    cache.set(data);
    return data;
  };
})();

const textElms = () =>
  cached("textElms", () => [
    ...selectAll('input[type="text"]'),
    ...selectAll('input[type="email"]')
  ]);
const submits = () =>
  cached("submits", () => selectAll('input[type="submit"]'));
const radios = () => cached("radios", () => selectAll('input[type="radio"]'));
const radioValue = (name) => {
  const checked = Array.from(document.getElementsByName(name)).filter(
    (e) => e.checked
  );
  if (checked.length === 0) return "";
  return checked[0].value;
};
const selects = () => cached("selects", () => selectAll("select"));

const errorId = (name) => `form_error_${name}`;
const errors = new Set();
const initErrorElm = (name) => {
  const elm = document.createElement("div");
  elm.setAttribute("id", errorId(name));
  elm.classList.add("caution");
  return elm;
};
const exitsErrorElm = (name) => document.querySelector(`#${errorId(name)}`);
const errorElm = (name) =>
  document.querySelector(`#${errorId(name)}`) || initErrorElm(name);

const setError = (name, message) => {
  errors.add(name);
  const elm = errorElm(name);
  elm.textContent = message;
  elm.hidden = false;

  submits().forEach((e) => {
    e.disabled = true;
  });
};

const removeError = (name) => {
  errors.delete(name);
  errorElm(name).hidden = true;
  if (errors.size === 0) {
    submits().forEach((e) => {
      e.disabled = false;
    });
  }
};

const isValidEmail = (text) => /[\w_\-.]+@[\w_\-.]+\.[A-Za-z]+/.test(text);

const checkError = (name, value, opt = {}) => {
  const { required = false, type = "" } = opt;
  if (
    type === "select" &&
    required &&
    (value.indexOf("0:") === 0 || value.indexOf(":") === 0)
  )
    return setError(name, "入力必須項目です");
  if (required && value === "") return setError(name, "入力必須項目です");
  if (type === "email" && !isValidEmail(value))
    return setError(name, "Eメールアドレスを記入してください");
  return removeError(name);
};

const isRequired = (elm) =>
  elm.getAttribute("required") || elm.classList.contains("required");

const getType = (elm) =>
  elm.nodeName === "SELECT" ? "select" : elm.getAttribute("type");

const checkElm = (elm) => {
  const type = getType(elm);
  const required = isRequired(elm);
  const name = elm.getAttribute("name");
  const value = (() => {
    if (type === "radio") return radioValue(name);
    if (type === "select")
      return `${elm.selectedIndex}:${elm.options[elm.selectedIndex].value}`;
    return elm.value;
  })();
  checkError(name, value, { required, type });
};

const init = () => {
  const elms = [...textElms(), ...radios(), ...selects()];
  elms.forEach((elm) => {
    const name = elm.getAttribute("name");
    const type = getType(elm);
    if (!exitsErrorElm(name)) elm.before(errorElm(name));
    if (type === "radio") elm.addEventListener("click", (e) => checkElm(elm));
    if (type === "text" || type === "email" || type === "select")
      elm.addEventListener("blur", (e) => checkElm(elm));
    if (type === "select") elm.addEventListener("change", (e) => checkElm(elm));
    if (type === "text" || type === "email")
      elm.addEventListener("keyup", (e) => checkElm(elm));
  });
  elms
    .filter((e) => isRequired(e))
    .map((e) => e.getAttribute("name"))
    .forEach((name) => errors.add(name));
  submits().forEach((elm) => {
    elm.disabled = true;
  });
};

document.onkeypress = (event) => {
  if (event.keyCode === 13) {
    return false;
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
//init();
