import React from 'react';
import { shallow, mount } from 'enzyme';
import DevToolWithDiagnostics from './DevToolWithDiagnostics';
import DiagnosticsSummaryCircle from "../../DiagnosticsFeature/Presenters/DiagnosticsSummaryCircle";
import DevTool from "./DevTool";
import DevToolName from "./DevToolName";

describe('DevToolWithDiagnostics', () => {
  it('should only display tool icon when no diagnostics exists', () => {
    let subject = shallow(<DevToolWithDiagnostics iconUri="atom://haha.png"/>);

    expect(subject.find(DiagnosticsSummaryCircle).length).toBe(0);
    expect(subject.find(DevToolName).length).toBe(0);
    expect(subject.find(DevTool).length).toBe(1);
    expect(subject.find(DevTool).at(0).prop('iconUri')).toBe('atom://haha.png');
  });

  it('should display tool icon with one yellow circle with number if only warnings exist', () => {
    let subject = shallow(<DevToolWithDiagnostics warnings={2}/>);

    expect(subject.find(DevTool).length).toBe(1);
    expect(subject.find(DiagnosticsSummaryCircle).length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "warning").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "warning").prop('number')).toBe(2);
    expect(subject.find(DevToolName).length).toBe(0);
  });

  it('should display tool icon with with one yellow / red circle if errors and warnings exist', () => {
    let subject = shallow(<DevToolWithDiagnostics warnings={2} errors={5}/>);

    expect(subject.find(DevTool).length).toBe(1);
    expect(subject.find(DiagnosticsSummaryCircle).length).toBe(2);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "warning").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "warning").prop('number')).toBe(2);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "error").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "error").prop('number')).toBe(5);
    expect(subject.find(DevToolName).length).toBe(0);
  });

  it('should display tool icon with one blue / red circle if errors and infos exist', () => {
    let subject = shallow(<DevToolWithDiagnostics infos={2} errors={5} warning={0}/>);

    expect(subject.find(DevTool).length).toBe(1);
    expect(subject.find(DiagnosticsSummaryCircle).length).toBe(2);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "info").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "info").prop('number')).toBe(2);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "error").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "error").prop('number')).toBe(5);
    expect(subject.find(DevToolName).length).toBe(0);
  });

  it('should display tool icon with blue / red / yellow / green circle if every diagnostic exist', () => {
    let subject = shallow(<DevToolWithDiagnostics infos={2} errors={5} warnings={1} successes={5}/>);

    expect(subject.find(DevTool).length).toBe(1);
    expect(subject.find(DiagnosticsSummaryCircle).length).toBe(4);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "info").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "info").prop('number')).toBe(2);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "error").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "error").prop('number')).toBe(5);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "warning").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "warning").prop('number')).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "success").length).toBe(1);
    expect(subject.findWhere(elem => elem.type() == DiagnosticsSummaryCircle && elem.prop('type') == "success").prop('number')).toBe(5);
    expect(subject.find(DevToolName).length).toBe(0);
  });

  it('should display tool name on tool icon hovering', () => {
    let subject = shallow(<DevToolWithDiagnostics infos={2} errors={5} name="gulp"/>);

    subject.find('div').at(0).simulate('mouseenter');

    expect(subject.find(DevTool).length).toBe(1);
    expect(subject.find(DevToolName).length).toBe(1);
    expect(subject.find(DevToolName).at(0).prop('children')).toBe("gulp");

    subject.find('div').at(0).simulate('mouseleave');

    expect(subject.find(DevTool).length).toBe(1);
    expect(subject.find(DevToolName).length).toBe(0);
  });

  it('should call onDiagnosticClick with diagnostic type on diagnostic circle click', () => {
    let spy = jest.fn();
    let subject = shallow(<DevToolWithDiagnostics infos={2} errors={5} onDiagnosticClick={spy}/>);

    subject.simulate('mouseenter');
    subject.find(DiagnosticsSummaryCircle).at(0).simulate('click');

    expect(spy).toBeCalledWith('error');
  });

  it('should call onLogsClick on devtool icon click', () => {
    let spy = jest.fn();
    let subject = shallow(<DevToolWithDiagnostics infos={2} errors={5} onLogsClick={spy}/>);

    subject.simulate('mouseenter');
    subject.find(DevTool).at(0).simulate('click');

    expect(spy).toBeCalled();
  });

  it('should call onSettingsClick on devtool name click', () => {
    let spy = jest.fn();
    let subject = shallow(<DevToolWithDiagnostics infos={2} errors={5} onSettingsClick={spy}/>);

    subject.simulate('mouseenter');
    subject.find(DevToolName).at(0).simulate('click');

    expect(spy).toBeCalled();
  });
});