import React, { useEffect, useState, ChangeEvent } from "react";
import Button from "../Button";
import Checkbox from '../Checkbox';

interface RowData {
  phone: string;
  url: string;
  checked: boolean;
  category: string;
}

const CheckerPage = () => {
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("tableData");
    const savedOptions = localStorage.getItem("options");
    if (savedData) setTableData(JSON.parse(savedData));
    if (savedOptions) setOptions(JSON.parse(savedOptions));
  }, []);

  useEffect(() => {
    localStorage.setItem("tableData", JSON.stringify(tableData));
  }, [tableData]);

  useEffect(() => {
    localStorage.setItem("options", JSON.stringify(options));
  }, [options]);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      const parsed = lines.map((line) => {
        const [phone, url] = line.split(",");
        return { phone, url, checked: false, category: "" };
      });
      setTableData(parsed);
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const csv = tableData
      .filter((row) => row.checked)
      .map((row) => `${row.phone},${row.url}`)
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "download.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddOption = () => {
    if (newOption && !options.includes(newOption)) {
      setOptions([...options, newOption]);
      setNewOption("");
    } else {
      alert("Please enter a unique option.");
    }
  };

  const handleRemoveOption = () => {
    if (options.includes(newOption)) {
      setOptions(options.filter((opt) => opt !== newOption));
      setNewOption("");
    } else {
      alert("Option not found.");
    }
  };

  const removeRow = (index: number) => {
    const updated = [...tableData];
    updated.splice(index, 1);
    setTableData(updated);
  };

  const updateRow = (index: number, updates: Partial<RowData>) => {
    const updated = [...tableData];
    updated[index] = { ...updated[index], ...updates };
    setTableData(updated);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      const notification = document.createElement('div');
      notification.textContent = 'Copied to clipboard!';
      notification.className = 'fixed bottom-5 right-5 bg-yellow-100 text-yellow-800 px-4 py-2 rounded shadow-lg';
      document.body.appendChild(notification);

      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500); // Remove notification after 3 seconds
    });
  };

  const openInstagramProfile = (url: string) => {
    const fullUrl = url.startsWith("https://www.instagram.com/")
      ? url
      : `https://www.instagram.com/${url}`;
    window.open(fullUrl, "_blank");
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-black text-white p-4 space-y-4">
      {/* Controls */}
      <div className="bg-[#1a1a1a] sticky top-0 z-30 p-4 rounded-lg flex flex-col md:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-grow">
          <input
            type="text"
            placeholder="Write here the option..."
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            className="px-4 py-2 rounded border border-gray-600 bg-black text-white flex-grow"
          />
          <Button variant="primary" onClick={handleAddOption}>Add</Button>
          <Button variant="destructive" onClick={handleRemoveOption}>Remove</Button>
        </div>
        <div className="flex gap-2 flex-grow">
          <input
            type="text"
            placeholder="Write filename here..."
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="px-4 py-2 rounded border border-gray-600 bg-black text-white flex-grow"
          />
          <input
            type="file"
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
            id="csvInput"
          />
          <Button as="label" htmlFor="csvInput">Upload</Button>
          <Button variant="success" onClick={handleDownload}>Download</Button>
        </div>
      </div>

      {/* Table or Cards */}
      {!isMobile ? (
        <div className="overflow-y-auto max-h-[calc(100vh-180px)]">
          <table className="min-w-full bg-[#121212] text-white shadow-lg rounded-lg table-fixed border-separate border-spacing-y-2">
            <thead className="sticky top-0 bg-[#1a1a1a] z-10">
              <tr className="text-center font-semibold text-sm text-gray-300">
                <th className="px-4 py-2">Phone</th>
                <th className="px-4 py-2">Link</th>
                <th className="px-4 py-2">Check</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((data, index) => (
                <tr
                  key={index}
                  className="text-center bg-[#1c1c1c] hover:bg-[#2a2a2a] transition rounded-lg"
                >
                  <td className="px-4 py-3">
                    <Button
                      variant="success"
                      onClick={() => copyToClipboard(data.phone)}
                    >
                      {data.phone}
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="secondary"
                      onClick={() => openInstagramProfile(data.url)}
                    >
                      {data.url}
                    </Button>
                  </td>

                  <td className="px-4 py-3">
                    <Checkbox
                      checked={data.checked}
                      onChange={(e) => updateRow(index, { checked: e.target.checked })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={data.category}
                      onChange={(e) => updateRow(index, { category: e.target.value })}
                      className="px-3 py-2 rounded border border-gray-700 bg-black text-white w-full"
                    >
                      <option value="">Select</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="destructive" onClick={() => removeRow(index)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
          {tableData.map((data, index) => (
            <div key={index} className="bg-[#121212] text-white shadow rounded p-4 space-y-2">
              <div className="text-lg font-bold">{data.phone}</div>
              <div className="space-x-2">
                <Button variant="success" onClick={() => copyToClipboard(data.phone)}>Copy</Button>
                <Button variant="secondary" onClick={() => openInstagramProfile(data.url)}>Link</Button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.checked}
                  onChange={(e) => updateRow(index, { checked: e.target.checked })}
                />
                <select
                  value={data.category}
                  onChange={(e) => updateRow(index, { category: e.target.value })}
                  className="form-select rounded border border-gray-600 bg-black text-white"
                >
                  <option value="">Select</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <Button onClick={() => removeRow(index)}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CheckerPage;