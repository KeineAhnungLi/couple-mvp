"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CameraIcon, PinIcon } from "@/components/footprints/icons";

const provinces = [
  "北京市", "天津市", "上海市", "重庆市", "河北省", "山西省", "辽宁省", "吉林省", "黑龙江省",
  "江苏省", "浙江省", "安徽省", "福建省", "江西省", "山东省", "河南省", "湖北省", "湖南省",
  "广东省", "海南省", "四川省", "贵州省", "云南省", "陕西省", "甘肃省", "青海省", "台湾省",
  "内蒙古自治区", "广西壮族自治区", "西藏自治区", "宁夏回族自治区", "新疆维吾尔自治区",
  "香港特别行政区", "澳门特别行政区", "海外",
];

const moods = ["开心", "平静", "感动", "有点累", "满足", "惊喜"];
const defaultTags = ["旅行", "和家人", "散步", "看风景", "看海", "美食", "纪念日"];

export function LocationCapture() {
  const [status, setStatus] = useState("正在尝试获取 GPS…");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setStatus("当前浏览器不支持定位，可以继续手动填写地点。");
      return;
    }
    setStatus("正在获取 GPS…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(7));
        setLng(position.coords.longitude.toFixed(7));
        setStatus(`GPS 已记录 · 精度约 ${Math.round(position.coords.accuracy)}m`);
      },
      () => setStatus("没有取得定位权限；仍可正常保存地点和照片。"),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 },
    );
  };

  useEffect(() => {
    requestLocation();
  }, []);

  return (
    <div className="fp-gps-row">
      <input type="hidden" name="latitude" value={lat} />
      <input type="hidden" name="longitude" value={lng} />
      <input type="hidden" name="timezoneOffset" value={String(new Date().getTimezoneOffset())} />
      <div className="fp-gps-status">
        <PinIcon size={19} />
        <span>{status}</span>
      </div>
      <button type="button" onClick={requestLocation} className="fp-small-button">重新定位</button>
    </div>
  );
}

export function RegionFields() {
  return (
    <div className="fp-region-grid">
      <label>
        <span>省 / 地区</span>
        <select name="province" defaultValue="">
          <option value="">请选择</option>
          {provinces.map((province) => <option value={province} key={province}>{province}</option>)}
        </select>
      </label>
      <label>
        <span>城市</span>
        <input name="city" placeholder="如：苏州市" maxLength={60} />
      </label>
      <label>
        <span>区 / 县</span>
        <input name="district" placeholder="如：姑苏区" maxLength={60} />
      </label>
      <label className="is-wide">
        <span>地点</span>
        <input name="placeName" placeholder="如：平江路 / 西湖 / 奶奶家" maxLength={100} />
      </label>
    </div>
  );
}

export function PhotoPicker() {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  return (
    <div className="fp-photo-picker">
      <input
        id="footprint-photos"
        className="fp-file-input"
        type="file"
        name="photos"
        accept="image/*"
        multiple
        onChange={(event) => {
          previews.forEach((url) => URL.revokeObjectURL(url));
          const files = Array.from(event.target.files || []).slice(0, 6);
          setPreviews(files.map((file) => URL.createObjectURL(file)));
        }}
      />
      <div className="fp-upload-strip">
        {previews.map((url, index) => (
          <div className="fp-upload-preview" key={url} style={{ transform: `rotate(${index % 2 === 0 ? -1.2 : 1.1}deg)` }}>
            <span className="fp-tape fp-tape-tan" aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`待上传照片 ${index + 1}`} />
          </div>
        ))}
        <label htmlFor="footprint-photos" className="fp-add-photo-card">
          <span className="fp-tape fp-tape-green" aria-hidden="true" />
          <CameraIcon size={34} />
          <strong>{previews.length ? "重新选择" : "添加照片"}</strong>
          <small>一次可选多张 · 最多 6 张 · 总计不超过 18MB</small>
        </label>
      </div>
    </div>
  );
}

export function MoodSelector() {
  const [value, setValue] = useState("开心");
  return (
    <div className="fp-mood-grid">
      {moods.map((mood) => (
        <label key={mood} className={`fp-mood-stamp ${value === mood ? "is-selected" : ""}`}>
          <input
            type="radio"
            name="mood"
            value={mood}
            checked={value === mood}
            onChange={() => setValue(mood)}
          />
          <span className="fp-mood-face">{mood === "开心" ? "☺" : mood === "有点累" ? "◡" : "○"}</span>
          {mood}
        </label>
      ))}
    </div>
  );
}

export function TagSelector() {
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const options = useMemo(() => Array.from(new Set([...defaultTags, ...selected])), [selected]);

  const toggle = (tag: string) => {
    setSelected((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);
  };

  const addCustom = () => {
    const tag = custom.trim();
    if (!tag) return;
    setSelected((current) => Array.from(new Set([...current, tag])).slice(0, 10));
    setCustom("");
  };

  return (
    <div>
      <div className="fp-tag-grid">
        {options.map((tag) => (
          <label key={tag} className={`fp-tag-chip ${selected.includes(tag) ? "is-selected" : ""}`}>
            <input type="checkbox" name="tags" value={tag} checked={selected.includes(tag)} onChange={() => toggle(tag)} />
            {tag}{selected.includes(tag) ? " ×" : ""}
          </label>
        ))}
      </div>
      <div className="fp-add-tag-row">
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="自定义标签" maxLength={20} />
        <button type="button" onClick={addCustom}>添加</button>
      </div>
    </div>
  );
}

export function TripFields() {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="fp-trip-fields">
      <label className="fp-trip-toggle">
        <input type="checkbox" name="createTrip" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>把这段记录标记成一次旅行</span>
      </label>
      {enabled ? (
        <div className="fp-trip-detail-grid">
          <label className="is-wide"><span>旅行名称</span><input name="tripTitle" placeholder="如：杭州三日游" maxLength={100} required /></label>
          <label><span>开始日期</span><input type="date" name="tripStartDate" required /></label>
          <label><span>结束日期</span><input type="date" name="tripEndDate" required /></label>
        </div>
      ) : null}
    </div>
  );
}

export function SubmitFootprintButton() {
  const status = useFormStatus();
  return (
    <button className="fp-primary-button" type="submit" disabled={status.pending}>
      <span aria-hidden="true">❧</span>
      {status.pending ? "正在收进手账…" : "收进手账"}
    </button>
  );
}
