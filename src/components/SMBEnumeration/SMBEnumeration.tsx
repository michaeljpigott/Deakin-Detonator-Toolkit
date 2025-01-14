import { Button, LoadingOverlay, NativeSelect, Stack, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useCallback, useState } from "react";
import { CommandHelper } from "../../utils/CommandHelper";
import ConsoleWrapper from "../ConsoleWrapper/ConsoleWrapper";
import { SaveOutputToTextFile } from "../SaveOutputToFile/SaveOutputToTextFile";

import { UserGuide } from "../UserGuide/UserGuide";
import { LoadingOverlayAndCancelButton } from "../OverlayAndCancelButton/OverlayAndCancelButton";

const title = "SMB Enumeration";
const description_userguide =
    "SMB (Server Message Block) represents a network protocol widely used to " +
    "provide shared access across files, printers, and serial ports within a network. " +
    "This tool acts to enumerate an SMB server in order for potential vulnerabilities " +
    "or misconfigurations tobe identified. \n\n" +
    "How to use SMB Enumeration:\n\n" +
    "Step 1: Enter an IP or Hostname.\n" +
    "       E.g. 127.0.0.1\n\n" +
    "Step 2: Enter a port number\n" +
    "       E.g. 445\n\n" +
    "Step 3: Pick a scan speed -Note; Higher speeds require a faster host network.\n" +
    "T0 -Paranoid / T1 -Sneaky / T2 -Polite / T3 -Normal / T4 -Aggressive / T5 -Insane\n" +
    "       E.g. T3\n\n" +
    "Step 4: Select an SMB Enumeration Script to run against the target\n" +
    "       E.g smb-flood.nse";
"\n\nStep 5: Click Scan to commence the SMB Enumeration operation.\n\n" +
    "Step 6: View the Output block below to view the results of the Scan.";

interface FormValuesType {
    ip: string;
    port: string;
    speed: string;
    scripts: string;
}

const speeds = ["T0", "T1", "T2", "T3", "T4", "T5"];

const scripts = [
    "smb2-capabilities.nse",
    "smb2-security-mode.nse",
    "smb2-time.nse",
    "smb2-vuln-uptime.nse",
    "smb-brute.nse",
    "smb-double-pulsar-backdoor.nse",
    "smb-enum-domains.nse",
    "smb-enum-groups.nse",
    "smb-enum-processes.nse",
    "smb-enum-services.nse",
    "smb-enum-sessions.nse",
    "smb-enum-shares.nse",
    "smb-enum-users.nse",
    "smb-flood.nse",
    "smb-ls.nse",
    "smb-mbenum.nse",
    "smb-os-discovery.nse",
    "smb-print-text.nse",
    "smb-protocols.nse",
    "smb-psexec.nse",
    "smb-security-mode.nse",
    "smb-server-stats.nse",
    "smb-system-info.nse",
    "smb-vuln-conficker.nse",
    "smb-vuln-cve2009-3103.nse",
    "smb-vuln-cve-2017-7494.nse",
    "smb-vuln-ms06-025.nse",
    "smb-vuln-ms07-029.nse",
    "smb-vuln-ms08-067.nse",
    "smb-vuln-ms10-054.nse",
    "smb-vuln-ms10-061.nse",
    "smb-vuln-ms17-010.nse",
    "smb-vuln-regsvc-dos.nse",
    "smb-vuln-webexec.nse",
    "smb-webexec-exploit.nse",
];

const SMBEnumeration = () => {
    const [loading, setLoading] = useState(false);
    const [output, setOutput] = useState("");
    const [selectedSpeedOption, setSelectedSpeedOption] = useState("");
    const [selectedScriptOption, setSelectedScriptOption] = useState("");
    const [pid, setPid] = useState("");
    let form = useForm({
        initialValues: {
            ip: "",
            port: "",
            speed: "T3",
            script: "smb-enum-users",
        },
    });

    // Uses the callback function of runCommandGetPidAndOutput to handle and save data
    // generated by the executing process into the output state variable.
    const handleProcessData = useCallback((data: string) => {
        setOutput((prevOutput) => prevOutput + "\n" + data); // Update output
    }, []);

    // Uses the onTermination callback function of runCommandGetPidAndOutput to handle
    // the termination of that process, resetting state variables, handling the output data,
    // and informing the user.
    const handleProcessTermination = useCallback(
        ({ code, signal }: { code: number; signal: number }) => {
            if (code === 0) {
                handleProcessData("\nProcess completed successfully.");
            } else if (signal === 15) {
                handleProcessData("\nProcess was manually terminated.");
            } else {
                handleProcessData(`\nProcess terminated with exit code: ${code} and signal code: ${signal}`);
            }
            // Clear the child process pid reference
            setPid("");
            // Cancel the Loading Overlay
            setLoading(false);
        },
        [handleProcessData]
    );

    const onSubmit = async (values: FormValuesType) => {
        setLoading(true);

        // Check if the values.speed is not empty. If it is empty set it to T3.
        if (!values.speed) {
            values.speed = "T3";
        }

        const args = [`-${values.speed}`, `--script=${values.scripts}`];

        if (values.port) {
            args.push(`-p ${values.port}`);
        }

        args.push(values.ip);

        try {
            //const output = await CommandHelper.runCommand("nmap", args);
            const result = await CommandHelper.runCommandGetPidAndOutput(
                "nmap",
                args,
                handleProcessData,
                handleProcessTermination
            );
            setPid(result.pid);
            setOutput(result.output);
        } catch (e: any) {
            setOutput(e);
        }
    };

    const clearOutput = useCallback(() => {
        setOutput("");
    }, [setOutput]);

    return (
        <form
            onSubmit={form.onSubmit((values) =>
                onSubmit({ ...values, speed: selectedSpeedOption, scripts: selectedScriptOption })
            )}
        >
            {LoadingOverlayAndCancelButton(loading, pid)}
            <Stack>
                {UserGuide(title, description_userguide)}
                <TextInput label={"Target IP or Hostname"} required {...form.getInputProps("ip")} />
                <TextInput label={"Port"} required {...form.getInputProps("port")} placeholder={"Example: 445"} />

                <NativeSelect
                    label={"Scan Speed"}
                    value={selectedSpeedOption}
                    onChange={(e) => setSelectedSpeedOption(e.target.value)}
                    title={"Scan speed"}
                    data={speeds}
                    placeholder={"Select a scan speed. Default set to T3"}
                    description={"Speed of the scan, refer: https://nmap.org/book/performance-timing-templates.html"}
                />

                <NativeSelect
                    label={"SMB Script"}
                    value={selectedScriptOption}
                    onChange={(e) => setSelectedScriptOption(e.target.value)}
                    title={"SMB Enumeration Script"}
                    data={scripts}
                    required
                    placeholder={"Select an SMB Enumeration Script to run against the target"}
                    description={"NSE Scripts, refer: https://nmap.org/nsedoc/scripts/"}
                />

                <Button type={"submit"}>Scan</Button>
                {SaveOutputToTextFile(output)}
                <ConsoleWrapper output={output} clearOutputCallback={clearOutput} />
            </Stack>
        </form>
    );
};

export default SMBEnumeration;
